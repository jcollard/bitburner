import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

export default class ServerCacheEntry {

    constructor(ns, cache, host_name) {
        NS = ns;
        this.ns = ns;
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
        this.host_name = host_name;
        this.cache = cache;
        this.prep_until = 0;
    }

    is_prepped() {
        if (this.ns.getServerMoneyAvailable(this.host_name) < this.ns.getServerMaxMoney(this.host_name)) return false;
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
            return;
        }

        debug ("   Server is prepped!");
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
        debug("   Weaken Threads Needed: %s", weaken_threads);
        if (weaken_threads > 0) {
            this.prep_until = Date.now() + 100 + this.ns.getWeakenTime(this.host_name);
            let remaining_threads = await this.run_weaken(weaken_threads);
            let started = weaken_threads - remaining_threads;
            debug("   Started %s Weaken Threads.", this.host_name, started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }

        let grow_threads = this.hacks.calc_grow_threads_needed(this.host_name);
        if (grow_threads > 0) {
            this.prep_until = Date.now() + 100 + this.ns.getGrowTime(this.host_name);
            let remaining_threads = await this.run_grow(grow_threads);
            let started = grow_threads - remaining_threads;
            debug("   Started %s threads.", this.host_name, started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }

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
