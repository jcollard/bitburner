import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";
import PortPrograms from "/DarkWeb/PortPrograms.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

// Phase 0, we acquire as port openers and open up as many free servers as possible.
// This should get us about 2k GB of network RAM.

// TOR -        $200_000
// BruteSSH -   $1_500_000
// FTPCrack.exe $5_000_000
// HTTPWorm.exe $30_000_000
// SQLInject    $250_000_000

// Strategy:
//   1. Limit weaken / grow / hack to a few servers with high growth rate based on Network Threads
//   2. Focus on getting money to buy hacks
export default class UpgradePortsPhase {

    constructor(ns) {
        this.ns = ns;
        NS = this.ns;
        // TODO: Seems to be an issue caching if you use getInstance.
        this.util =  new Util(ns); //Util.getInstance(ns);
        this.hacks = new HackUtil(ns); // .getInstance(ns);
        this.cache = new ServerCache(ns); //.getInstance(ns);
        this.ports = new PortPrograms(ns); //.getInstance(ns);
        this.hack_percent = 0.1;
        this.min_hack_percent = 0.1;
        this.max_hack_percent = 0.9;
        this.increments = 0;
        this.ticks_above = 0;
        this.ticks_below = 0;
    }

    async tick() {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        info("UpgradePortsPhase().tick()");

        info("... Trying to purchase programs: %s", this.ports.needed_programs());
        // Try to upgrade port programs
        this.ports.purchase_all_programs();

        // Try to open ports
        info("... Trying to open ports.");
        this.ports.open_ports();
        

        let targets = this.get_target_servers().map(s => this.cache.getServer(s));
        info("... Targets for hacking: %s", targets.map(s => s.host_name).join(", "));
        let workers = this.hacks.GetRunnables();
        const available_threads = this.hacks.get_available_threads(...workers);
        info("... %s workers with %s available threads ", workers.length, available_threads);

        for (let target of targets) {
            info("... Checking %s", target.host_name);
            // If there are not enough threads
            if (available_threads < 5) break;

            // If the server is not at minimum security, start weakening
            if (target.get_needed_weaken_threads() > 0) {
                info("... ... Security: %s / %s", target.security_level(), target.min_security_level());
                await this.weaken(target);
            }else if (target.can_grow()) {
                info("... ... Grow Target: ")
                await this.grow(target);
            } else if (target.can_hack(this.hack_percent)){
                info("... ... Hack Target: ")
                // Always try to hack if possible
                await this.hack(target);
                // this.ns.tprintf("UpgradePortsPhase > Something went wrong with %s. Did not weaken, hack, or grow.", target.host_name);
            } else {
                info("... ... Nothing to do.");
                this.ns.tprintf("Skip   > %s", target.host_name);
                this.ns.tprintf("... Can Hack: %s", target.can_grow(this.hack_percent));
                //this.get_needed_weaken_threads() === 0 && this.is_max_grow();
                this.ns.tprintf("... Needed Weaken Threads: %s", target.get_needed_weaken_threads());
                this.ns.tprintf("... Is Max Grow?: %s", target.is_max_grow());
                // is_max_grow = () => this.needed_grow_threads() <= this.running_grow_threads();
                this.ns.tprintf("... Needed Grow Threads: %s", target.needed_grow_threads());
                this.ns.tprintf("... Running Grow Threads: %s", target.running_grow_threads());
            }
        }

        const left_over_threads = this.hacks.get_available_threads(...workers);
        info("... Unused Threads: %s", left_over_threads);

        let adjust_percent = false;
        if (left_over_threads > 100) {
            this.ticks_above++;
            this.ticks_below = 0;
            if (this.ticks_above > 10) {
                if (!(this.hack_percent >= this.max_hack_percent)) {
                    
                    this.increments++;
                    this.hack_percent = this.min_hack_percent + (0.025 * this.increments);
                    this.hack_percent = Math.min(this.hack_percent, this.max_hack_percent);
                    this.ticks_above = 0;
                    this.ns.tprintf("UpgradePortPhase > Increasing Hack %% to %s", Math.floor(this.hack_percent * 10_000)/100)
                }
            }
        } else {
            this.ticks_above = 0;
            this.tick_below++;
            if (this.ticks_below > 10) {
                if (!(this.hack_percent <= this.min_hack_percent)) {
                    
                    this.increments--;
                    this.increments = Math.max(0, this.increments);
                    this.hack_percent = this.min_hack_percent + (0.025 * this.increments);
                    this.hack_percent = Math.min(this.hack_percent, this.max_hack_percent);
                    this.ticks_above = 0;
                    this.ns.tprintf("UpgradePortPhase > Decreasing Hack %% to %s", Math.floor(this.hack_percent * 10_000)/100)
                }
            }
        }


    }

    async weaken(target) {
        const info = await target.smart_weaken();
        if (info.workers === 0) return;
        let args = [ 
            this.util.formatNum(info.weaken_threads),
            this.util.formatTime(info.time),
            target.host_name 
        ]
        
        this.ns.tprintf("Weaken > %s threads for %s - %s", ...args);
    }

    async hack(target) {
        const info = await target.smart_hack(this.hack_percent);
        if (info.workers === 0) return;
        let args = [
            this.util.formatNum(info.hack_threads), 
            this.util.formatNum(info.workers), 
            this.util.formatNum(info.weaken_threads), 
            this.util.formatNum(target.get_money_for_hack(info.hack_threads)),
            Math.floor(target.hack_chance() * 1000)/10,
            this.util.formatTime(info.time), 
            target.host_name]; 
        //.map(num => util.formatNum(num));
        // this.ns.tprintf("Weaken > %s threads for %s - %s", ...args);
        // this.ns.tprintf("Hack");
        this.ns.tprintf("Hack   > %s threads on %s workers | %s counter threads | $%s * %s%% @ %s. - %s", ...args);

    }

    async grow(target) {
        const info = await target.smart_grow();
        
        if (info.workers === 0) return;
        let args = [
            this.util.formatNum(info.grow_threads), 
            this.util.formatNum(info.workers), 
            this.util.formatNum(info.weaken_threads), 
            this.util.formatTime(info.time), 
            target.host_name]; //.map(num => util.formatNum(num));
        this.ns.tprintf("Grow   > %s threads on %s workers | %s counter threads | @ %s - %s", ...args);
    }

    is_complete = () => this.ports.needed_programs().length === 0;
    
    async next_phase() {
        await this.ns.exec("/smart/deploy.js", "home");
    }

    get_target_servers() {
        // Use the 3 servers with the highest growth rate
        return this.hacks.GetHackables()
            .filter(s => this.ns.getServerGrowth(s))
            .slice(0, 3);
    }

}

/** @param {NS} ns **/
export async function main(ns) {
    let phase = new UpgradePortsPhase(ns);
    ns.tprintf("Starting Phase 0");
    while(true) {
        await phase.tick();
        await ns.sleep(5000);
    }
}