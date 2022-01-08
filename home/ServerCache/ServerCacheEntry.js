import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

export default class ServerCacheEntry {

    constructor(ns, cache, host_name, money_cap) {
        NS = ns;
        this.ns = ns;
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
        this.host_name = host_name;
        this.cache = cache;
        this.prep_until = 0;
        this.money_cap = money_cap ? money_cap : Number.POSITIVE_INFINITY;
    }

    is_prepped() {
        let money = this.ns.getServerMoneyAvailable(this.host_name);
        let max = Math.min(this.money_cap, this.ns.getServerMaxMoney(this.host_name));
        if (money < max) return false;
        if (this.ns.getServerSecurityLevel(this.host_name) > this.ns.getServerMinSecurityLevel(this.host_name)) return false;
        return true;
    }

    async tick() {
        debug("ServerCacheEntry(%s).tick()", this.host_name);

        if (this.prep_until > Date.now()) {
            debug("    Server is being prepped...");
            return;
        }

        // If this server is not prepped, perform a prep step this tick.
        if (!this.is_prepped()) {
            debug("Prepping %s", this.host_name);
            await this.prep_for_batch();
            this.cache.setNextTime(this.prep_until);
            return;
        }

        debug("   Server is prepped!");
    }

    calc_threads(max_ram) {
        if (!this.is_prepped()) return undefined;
        let max_threads = max_ram / this.hacks.HACK_RAM();
        let thread_data = {};
        thread_data.hack_threads = 1;
        thread_data.total_threads = -1;
        thread_data.counter_hack_threads = -1;
        thread_data.grow_threads = -1;
        thread_data.counter_grow_threads = -1;

        // Find the largest number of threads necessary for this batch
        // that will fit in the maximum amount of RAM.
        while (thread_data.total_threads < max_threads) {
            let hack_security = this.ns.hackAnalyzeSecurity(this.hack);
            thread_data.counter_hack_threads = Math.ceil(this.hacks.calc_threads_to_weaken(hack_security));
            let hack_percent = this.ns.hackAnalyze(this.host_name) * thread_data.hack_threads;
            let max_money = this.ns.getServerMaxMoney(this.host_name);
            let hack_amount = max_money * hack_percent;
            let remaining = max_money - hack_amount;
            // Never go below $1 million (or 10% whichever is less)
            let minimum = Math.min(1_000_000, max_money * 0.10);
            if (remaining < minimum) break;
            let counter_growth = Math.max(1, hack_amount / remaining);
            thread_data.grow_threads = Math.ceil(this.ns.growthAnalyze(this.host_name, counter_growth));
            thread_data.counter_grow_threads = Math.ceil(this.ns.growthAnalyzeSecurity(thread_data.grow_threads));
            thread_data.total_threads = thread_data.hack_threads + thread_data.counter_hack_threads + thread_data.grow_threads + thread_data.counter_grow_threads;
            thread_data.amount = hack_amount;
            thread_data.hack_threads++;
        }
        debug("   Thread Total: " + thread_data.total_threads);
        if (thread_data.total_threads === -1) return undefined;
        thread_data.ratio = thread_data.amount * this.ns.hackAnalyzeChance(this.host_name);
        return thread_data;
    }

    /**
     * Starts to prepare the specified target by either weakening or growing it.
     * @returns True if there is still memory available and false otherwise.
     */
    async prep_for_batch() {
        debug("ServerCacheEntry(%s).prep_for_batch()", this.host_name);

        // Get the server to the minimum security and maximum money.
        // Once a server is ready, it can be batched
        let weaken_threads = this.hacks.calc_weaken_threads_needed(this.host_name);
        if (weaken_threads > 0) {          
            this.prep_until = Date.now() + 100 + this.ns.getWeakenTime(this.host_name);
            let remaining_threads = await this.run_weaken(weaken_threads);
            let started = weaken_threads - remaining_threads;
            debug("   Started %s Weaken Threads.", started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }

        let grow_threads = this.hacks.calc_grow_threads_needed(this.host_name);
        if (grow_threads > 0) {
            debug("   Need %s grow threads.", grow_threads);
            this.prep_until = Date.now() + 100 + this.ns.getGrowTime(this.host_name);
            let remaining_threads = await this.run_grow(grow_threads);
            let started = grow_threads - remaining_threads;
            debug("   Started %s grow threads.", started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }
        debug ("   Prep is finished!");
        return true;
    }

    weaken = (server_info) => this.scp_and_exec(HackUtil.WEAKEN_SCRIPT, server_info);
    hack = (server_info) => this.scp_and_exec(HackUtil.HACK_SCRIPT, server_info);
    grow = (server_info) => this.scp_and_exec(HackUtil.GROW_SCRIPT, server_info);

    async scp_and_exec(script, server_info) {
        await this.ns.scp(script, "home", this.host_name);
        await this.ns.exec(script, server_info.server, server_info.threads, this.host_name);
    }


    /**
     * Starts weakening the target. Returns the number of threads that are needed to finish weakening
     * the target.
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish weakening the target. 0 if it will be completely weakened after the run
     */
    run_weaken = (threads) => this.__run_f(this.weaken, this.hacks.WEAKEN_RAM(), threads);

    /**
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_grow = (threads) => this.__run_f(this.grow, this.hacks.GROW_RAM(), threads);

    /**
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_hack = (threads) => this.__run_f(this.hack, this.hacks.HACK_RAM(), threads);

    async __run_f(f, ram_per_thread, threads) {
        let threads_needed = threads;
        while (threads_needed > 0) {
            let server_info = this.cache.find_available_server(threads_needed, ram_per_thread);
            if (server_info === undefined) break;
            threads_needed -= server_info.threads;
            await f(server_info)
        }
        return threads_needed;
    }

}

class ThreadData {
    
}