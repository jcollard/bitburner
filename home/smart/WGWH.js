import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

export default class WGWH {
    /**
     * 
     * @param {NS} ns 
     */
    constructor(ns) {
        this.ns = ns;
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
        this.schedule = [];
        this.tick_speed = 1000;
        this.DEBUG = true;
    }

    debug(str, ...args) {
        if (!this.DEBUG) return;
        this.ns.tprintf(str, ...args);
    }

    async run() {
        while (true) {
            await this.tick();
            await this.ns.sleep(this.tick_speed);
        }
    }

    async tick() {
        this.debug("Entering Tick");
        let workers = this.hacks.GetRunnables();
        // If there is no RAM available, we cannot do any work so we just return.
        if (this.hacks.get_available_RAM(...workers) < this.hacks.HACK_RAM()) {
            this.debug("No RAM available. Skipping Tick.");
            return;
        }

        let to_hack = this.hacks.GetHackables();
        this.debug("Processing %s Hackable Servers...", to_hack.length);
        // Process each server that can be hacked
        for (let target of to_hack) {
            // this.ns.tprintf("Processing ")
            this.debug("Processing %s", target);
            // If the target server is not prepped, schedule it to be prepped
            if (!this.is_prepped(target)) {
                this.debug("Prepping %s", target);
                await this.prep_for_batch(target);
            }
        }
        this.debug("Exiting Tick");
    }

    is_prepped(target) {
        if (this.ns.getServerMoneyAvailable(target) < this.ns.getServerMaxMoney(target)) return false;
        if (this.ns.getServerSecurityLevel(target) > this.ns.getServerMinSecurityLevel(target)) return false;
        return true;
    }

    /**
     * Starts to prepare the specified target by either weakening or growing it.
     * @param {string} target - Target server
     * @returns True if there is still memory available and false otherwise.
     */
    async prep_for_batch(target) {
        // Get the server to the minimum security and maximum money.
        // Once a server is ready, it can be batched
        let weaken_threads = this.hacks.calc_max_threads(HackUtil.WEAKEN_SCRIPT, target);
        let weaken_time = this.ns.getWeakenTime(target);
        if (weaken_threads > 0) {
            let remaining_threads = await this.run_weaken(target, weaken_threads);
            let started = weaken_threads - remaining_threads;
            this.ns.tprintf("%s needs to be weakened. Started %s threads.", target, started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }

        let grow_threads = this.hacks.calc_grow_threads_needed(target);
        if (grow_threads > 0) {
            let remaining_threads = await this.run_grow(target, grow_threads);
            let started = grow_threads - remaining_threads;
            this.ns.tprintf("%s needs to be grown. Started %s threads.", target, started);
            if (remaining_threads > 0) {
                this.ns.toast("Out of Memory", "warning");
                return false;
            }
            return true;
        }

        return true;
    }

    calc_threads_needed(target) {
        let weaken_threads = this.hacks.calc_max_threads(HackUtil.WEAKEN_SCRIPT, target);
        let security_increase = this.ns.growthAnalyzeSecurity(growth_threads);
    }

    /**
     * Starts weakening the target. Returns the number of threads that are needed to finish weakening
     * the target.
     * @param {string} target - The target to weaken
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish weakening the target. 0 if it will be completely weakened after the run
     */
    run_weaken = (target, threads) => this.__run_f(this.weaken, this.hacks.WEAKEN_RAM(), target, threads);

    /**
     * @param {string} target - The target
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_grow = (target, threads) => this.__run_f(this.grow, this.hacks.GROW_RAM(), target, threads);

    /**
     * @param {string} target - The target
     * @param {number} threads - The number of threads to start
     * @returns The number of threads that are needed to finish the target. 0 if it will be completely weakened after the run
     */
    run_hack = (target, threads) => this.__run_f(this.hack, this.hacks.HACK_RAM(), target, threads);

    async __run_f(f, ram_per_thread, target, threads) {
        let threads_needed = threads;
        while (threads_needed > 0) {
            let server_info = this.find_available_server(threads_needed, ram_per_thread);
            if (server_info === undefined) break;
            threads_needed -= server_info.threads;
            await f(server_info, target)
        }
        return threads_needed;
    }

    /**
     * Find a server that has RAM available to run a script.
     * @param {number} threads - The number of threads needed.
     * @param {number} ram_per_thread - The amount of ram per thread
     * @returns a ServerInfo object or undefined if no ram was available
     */
    find_available_server(threads, ram_per_thread) {
        for (let server of this.hacks.GetRunnables()) {
            let max_threads = this.hacks.get_available_RAM(server) / ram_per_thread;
            if (max_threads == 0) continue;
            // If this server has some space to run 
            return new ServerInfo(server, Math.min(threads, max_threads));
        }
        return undefined;
    }

    weaken = (server_info, target) => this.run_script_on(HackUtil.WEAKEN_SCRIPT, server_info, target);
    hack = (server_info, target) => this.run_script_on(HackUtil.HACK_SCRIPT, server_info, target);
    grow = (server_info, target) => this.run_script_on(HackUtil.GROW_SCRIPT, server_info, target);

    async run_script_on(script, server_info, target) {
        await this.ns.scp(script, "home", target);
        await this.ns.exec(script, server_info.server, server_info.threads, target);
    }

}

class ServerInfo {
    constructor(server, threads) {
        this.server = server;
        this.threads = threads;
    }
}