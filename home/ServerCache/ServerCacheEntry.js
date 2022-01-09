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
        this.hack_until = -1;
        this.grow_until = -1;
        this.weaken_until = -1;
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
        debug("   Prep is finished!");
        return true;
    }

    /**
     * Attempts to grow this server to the max value in an intelligent way.
     * @param {number} threads - An optional number of threads to attempt. If unspecified, the maximum number of threads is attempted.
     * @returns const data = {
                time: expected_finish, // Millis for all threads to finish
                grow_threads: grow_threads_started, // # Of Grow Threads Started
                weaken_threads: weaken_threads_started // # Of Weaken Threads Started
            }
     */
    async smart_grow(threads) {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        info("ServerCacheEntry(%s).smart_grow()", this.host_name);

        // 1. Discover the number of threads needed to grow.
        // 2. Using the server with the most available RAM, start the
        //    maximum number of grow threads possible.
        // 3. For the threads started, discover the counter number of
        //    weaken threads to counter that grow.
        // 4. Using the servers with the **least** available RAM, start
        //    the counter threads across those servers
        // 5. If there are more grow threads necessary, wait some delta time
        //    then go to step 2

        // The amount of buffer time to give between executions
        const delta = 100;
        // Total amount of delay time among all threads
        let total_delay = 0;
        let start_time = Date.now();

        // Calculate the delay based on the desired finish time
        const calc_delay = (start_at) => start_at - start_time;
        // Total number of grow threads needed
        const target_grow_threads = threads ? threads : this.calc_grow_threads();
        if (target_grow_threads === 0) {
            info("... Nothing to grow.");
            return {
                time: 0,
                grow_threads: 0,
                weaken_threads: 0,
                workers: 0
            }
        }
        let grow_threads_needed = target_grow_threads;
        let grow_threads_started = 0;
        let weaken_threads_started = 0;
        let total_workers = 0;

        const final_return = () => {
            const expected_finish = Math.max(this.get_grow_time(), this.get_weaken_time()) + total_delay;
            info("... Grow Time: %s", this.util.formatNum(this.get_grow_time()));
            info("... Weaken Time: %s", this.util.formatNum(this.get_weaken_time()));
            info("... Expected Finish: %s", this.util.formatNum(expected_finish));
            this.grow_until = Date.now() + expected_finish;
            const data = {
                time: expected_finish,
                grow_threads: grow_threads_started,
                weaken_threads: weaken_threads_started,
                workers: total_workers,
            }
            return data;
        };

        while (grow_threads_needed > 0) {
            info("... %s growth threads needed.", grow_threads_needed);
            // worker_info.server --- host
            // worker_info.threads --- available # of threads
            const worker_info = this.cache.find_available_server(grow_threads_needed, this.hacks.GROW_RAM());
            if (worker_info === undefined) {
                // Out of RAM, abandon
                info("... Out of RAM, could not finish")
                return final_return();
            }
            info("... Found worker %s with %s threads.", worker_info.server, worker_info.threads);
            grow_threads_needed -= worker_info.threads;

            const start_grow = (delay) => this.grow(worker_info, delay);
            const counter_grow_threads = this.calc_counter_growth_threads(worker_info.threads);
            info("... This will require %s counter threads.", counter_grow_threads);
            const start_weaken = (delay) => this.run_weaken(counter_grow_threads, delay);

            let remaining_weaken_threads = -1;
            // If weaken will finish first, start weaken first
            const weaken_time = this.get_weaken_time();
            const grow_time = this.get_grow_time();
            info("... Weaken Time: %s millis | Grow Time: %s millis", this.util.formatNum(weaken_time), this.util.formatNum(grow_time));

            let weaken_start_time = -1;
            let grow_start_time = -1;
            if (weaken_time < grow_time) {
                // If this is the case, we have weaken delayed by the difference in grow_time and weaken time
                // plus a small delta
                weaken_start_time = (grow_time - weaken_time) + total_delay + delta;
                grow_start_time = total_delay;
                total_delay += delta;
            } else { // grow_time < weaken_time
                // If this is the case, we have grow delayed by the difference in weaken_time and grow_time
                // minus a small delta so the grow occurs first

                // TODO: If this is the case, we need to recalculate the grow threads because
                //       they may overlap with the weaken and we may be out of RAM.
                weaken_start_time = total_delay;
                grow_start_time = (weaken_time - grow_time) + total_delay - delta;
                
            }

            const grow_delay = grow_start_time; // calc_delay(grow_start_time);
            info("... Starting Grow Threads with Delay: %s", this.util.formatNum(grow_delay));
            await start_grow(grow_delay);
            grow_threads_started += worker_info.threads;
            total_workers++;
            const weaken_delay = weaken_start_time; //calc_delay(weaken_start_time);
            info("... Starting Counter Threads with Delay: %s", weaken_delay);
            remaining_weaken_threads = await start_weaken(weaken_delay);
            weaken_threads_started += counter_grow_threads;
            

            if (remaining_weaken_threads > 0) {
                info("... Out of RAM, could not finish");
                return final_return();
            }

            total_delay += delta;
        }
        const expected_finish = Math.max(this.get_grow_time(), this.get_weaken_time()) + total_delay;
        info("... Grow started, expected finish in %s millis", expected_finish);
        return final_return();
    }

    calc_counter_growth_threads(threads) {
        let security_increase = this.ns.growthAnalyzeSecurity(threads);
        return Math.ceil(this.hacks.calc_threads_to_weaken(security_increase));
    }

    calc_grow_threads = () => this.hacks.calc_grow_threads_needed(this.host_name);
    calc_weaken_threads = () => this.hacks.calc_weaken_threads_needed(this.host_name);
    calc_hack_threads = (percent) => this.hacks.calc_hack_threads(this.host_name, percent);

    get_weaken_time = () => this.ns.getWeakenTime(this.host_name);
    get_hack_time = () => this.ns.getHackTime(this.host_name);
    get_grow_time = () => this.ns.getGrowTime(this.host_name);

    weaken = (server_info, delay) => this.scp_and_exec(HackUtil.WEAKEN_SCRIPT, server_info, delay);
    hack = (server_info, delay) => this.scp_and_exec(HackUtil.HACK_SCRIPT, server_info, delay);
    grow = (server_info, delay) => this.scp_and_exec(HackUtil.GROW_SCRIPT, server_info, delay);

    async scp_and_exec(script, server_info, delay) {
        const info = () => undefined;
        // const info = debug;
        info("ServerCacheEntry(%s).scp_and_exec(%s, %s)", this.host_name, script, server_info.server);
        if (delay === undefined) delay = 0;
        await this.ns.scp(script, "home", server_info.server);
        await this.ns.exec(script, server_info.server, server_info.threads, this.host_name, delay);
    }

    /**
     * Starts weakening the target. Returns the number of threads that are needed to finish weakening
     * the target.
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish weakening the target. 0 if it will be completely weakened after the run
     */
    run_weaken = (threads, delay) => this.__run_f(this.weaken, this.hacks.WEAKEN_RAM(), threads, () => this.weaken_until = Date.now() + this.ns.getWeakenTime(this.host_name), delay, true);

    /**
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_grow = (threads, delay) => this.__run_f(this.grow, this.hacks.GROW_RAM(), threads, () => this.grow_until = Date.now() + this.ns.getGrowTime(this.host_name), delay);

    /**
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_hack = (threads, delay) => this.__run_f(this.hack, this.hacks.HACK_RAM(), threads, () => this.hack_until = Date.now() + this.ns.getHackTime(this.host_name), delay);

    async __run_f(f, ram_per_thread, threads, finished_at, delay, reverse) {
        const info = () => undefined;
        // const info = debug;
        info("ServerCacheEntry(%s).__run_f(%s)", this.host_name, f);
        let threads_needed = threads;
        while (threads_needed > 0) {
            let server_info = this.cache.find_available_server(threads_needed, ram_per_thread, reverse);
            if (server_info === undefined) break;
            threads_needed -= server_info.threads;
            await f(server_info, delay)
        }
        if (threads_needed !== threads) {
            finished_at();
        }
        return threads_needed;
    }

}

class ThreadData {

}