import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";
import PortPrograms from "/DarkWeb/PortPrograms.js";
import Network from "/Network/Network.js";
import * as Files from "/utils/Files.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}


export default class SimplePhase {

    constructor(ns, hack_percent) {
        this.ns = ns;
        NS = this.ns;
        // TODO: Seems to be an issue caching if you use getInstance.
        this.util = new Util(ns); //Util.getInstance(ns);
        this.hacks = new HackUtil(ns); // .getInstance(ns);
        this.cache = new ServerCache(ns); //.getInstance(ns);
        this.ports = new PortPrograms(ns); //.getInstance(ns);
        this.net = new Network(ns);
        this.hack_percent = 0.1;
        this.min_hack_percent = hack_percent ? hack_percent : 0.1;
        this.max_hack_percent = 0.9;
        this.increments = 0;
        this.ticks_above = 0;
        this.ticks_below = 0;
        this.silent = false;
    }

    tprintf(str, ...args) {
        if (this.silent) return;
        this.ns.tprintf(str, ...args);
    }

    async tick() {
        this.silent = JSON.parse(await this.ns.read(Files.SILENT_FILE));
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        info("SimplePhase().tick()");

        let workers = this.hacks.GetRunnables();
        const available_threads = this.hacks.get_available_threads(...workers);
        await this.before_processing(workers, available_threads);

        const targets = this.get_target_servers().map(s => this.cache.getServer(s));
        info("... Targets for hacking: %s", targets.map(s => s.host_name).join(", "));
        for (let target of targets) await this.process(target, available_threads, workers);

        const left_over_threads = this.hacks.get_available_threads(...workers);
        info("... Unused Threads: %s", left_over_threads);
        await this.end_of_tick(left_over_threads);

    }

    async before_processing(workers, available_threads) {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        // Try to open ports
        info("... %s workers with %s available threads ", workers.length, available_threads);
        info("... Trying to open ports.");
        this.ports.open_ports();

        info("... Trying to install backdoors.");
        await this.net.start_next_backdoor();

        
    }

    async end_of_tick(left_over_threads) {
        let adjust_percent = false;
        if (left_over_threads > 100) {
            this.ticks_above++;
            this.ticks_below = 0;
            if (this.ticks_above > 5) {
                if (!(this.hack_percent >= this.max_hack_percent)) {

                    this.increments++;
                    this.hack_percent = this.min_hack_percent + (0.025 * this.increments);
                    this.hack_percent = Math.min(this.hack_percent, this.max_hack_percent);
                    this.ticks_above = 0;
                    this.tprintf("UpgradePortPhase > Increasing Hack %% to %s", Math.floor(this.hack_percent * 10_000) / 100)
                }
            }
        } else {
            this.ticks_above = 0;
            this.tick_below++;
            if (this.ticks_below > 5) {
                if (!(this.hack_percent <= this.min_hack_percent)) {

                    this.increments--;
                    this.increments = Math.max(0, this.increments);
                    this.hack_percent = this.min_hack_percent + (0.025 * this.increments);
                    this.hack_percent = Math.min(this.hack_percent, this.max_hack_percent);
                    this.ticks_above = 0;
                    this.tprintf("UpgradePortPhase > Decreasing Hack %% to %s", Math.floor(this.hack_percent * 10_000) / 100)
                }
            }
        }
    }

    async process(target, available_threads, workers) {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        info("... Porcessing %s", target.host_name);
        // If there are not enough threads
        if (available_threads < 5) return;

        // If the server is not at minimum security, start weakening
        if (target.get_needed_weaken_threads() > 0) {
            info("... ... Security: %s / %s", target.security_level(), target.min_security_level());
            await this.weaken(target);
        } else if (target.can_grow()) {
            info("... ... Grow Target: ")
            await this.grow(target);
        } else if (target.can_hack(this.hack_percent)) {
            info("... ... Hack Target: ")
            // Always try to hack if possible
            await this.hack(target);
            // this.ns.tprintf("UpgradePortsPhase > Something went wrong with %s. Did not weaken, hack, or grow.", target.host_name);
        } else {
            info("... ... Nothing to do.");
            this.tprintf("Skip   > %s", target.host_name);
            this.tprintf("... Can Hack: %s", target.can_grow(this.hack_percent));
            //this.get_needed_weaken_threads() === 0 && this.is_max_grow();
            this.tprintf("... Needed Weaken Threads: %s", target.get_needed_weaken_threads());
            this.ns.tprintf("... Is Max Grow?: %s", target.is_max_grow());
            // is_max_grow = () => this.needed_grow_threads() <= this.running_grow_threads();
            this.tprintf("... Needed Grow Threads: %s", target.needed_grow_threads());
            this.tprintf("... Running Grow Threads: %s", target.running_grow_threads());
        }

        // Help with glitching.
        await this.ns.sleep(10);
    }

    async weaken(target) {
        const info = await target.smart_weaken();
        if (info.weaken_threads === 0) return info;
        let args = [
            this.util.formatNum(info.weaken_threads),
            this.util.formatTime(info.time),
            target.host_name
        ]

        this.tprintf("Weaken > %s threads for %s - %s", ...args);
        return info;
    }

    async hack(target) {
        const info = await target.smart_hack(this.hack_percent);
        if (info.workers === 0) return info;
        let args = [
            this.util.formatNum(info.hack_threads),
            this.util.formatNum(info.workers),
            this.util.formatNum(info.weaken_threads),
            this.util.formatNum(target.get_money_for_hack(info.hack_threads)),
            Math.floor(target.hack_chance() * 1000) / 10,
            this.util.formatTime(info.time),
            target.host_name];
        //.map(num => util.formatNum(num));
        // this.ns.tprintf("Weaken > %s threads for %s - %s", ...args);
        // this.ns.tprintf("Hack");
        this.tprintf("Hack   > %s threads on %s workers | %s counter threads | $%s * %s%% @ %s. - %s", ...args);
        return info;
    }

    async grow(target) {
        const info = await target.smart_grow();

        if (info.workers === 0) return info;
        let args = [
            this.util.formatNum(info.grow_threads),
            this.util.formatNum(info.workers),
            this.util.formatNum(info.weaken_threads),
            this.util.formatTime(info.time),
            target.host_name]; //.map(num => util.formatNum(num));
        this.tprintf("Grow   > %s threads on %s workers | %s counter threads | @ %s - %s", ...args);
        return info;
    }

    is_complete = () => false; 

    async next_phase() {
        
    }

    get_target_servers(max) {
        if (max === undefined) max = 3;
        // Hack servers that have the longest weaken time first
        let profitRatio = s => (this.cache.getServer(s).max_money() * this.ns.hackAnalyzeChance(s)) / this.ns.getWeakenTime(s);
        let cmp_profit = (s0, s1) => profitRatio(s1) - profitRatio(s0);
        let sVal = s => this.cache.getServer(s).security_level();
        let cmp_weaken = (s0, s1) => sVal(s1) - sVal(s0);
        // Start with servers with the highest security value (weaken new servers)
        let weakest = this.hacks.GetHackables()
            .filter(s => !this.cache.getServer(s).is_min_security())
            .sort(cmp_weaken);

        // Then hack the ones that have the highest money ratio
        let most_profit = this.hacks.GetHackables()
            .filter(s => this.cache.getServer(s).is_min_security())
            .sort(cmp_profit);

        weakest.push(...most_profit)
        return weakest.slice(0, max);
    }

}

/** @param {NS} ns **/
export async function main(ns) {
    await ns.spawn("/auto/phase/UpgradeNetworkPhase.js");
}