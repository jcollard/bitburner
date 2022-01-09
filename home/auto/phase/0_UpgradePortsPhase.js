import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";
import PortPrograms from "/DarkWeb/PortPrograms.js";


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
        this.util = Util.getInstance(ns);
        this.hacks = HackUtil.getInstance(ns);
        this.cache = ServerCache.getInstance(ns);
        this.ports = PortPrograms.getInstance(ns);
    }

    async tick() {
        // Try to upgrade port programs
        this.ports.purchase_all_programs();

        // Try to open ports
        this.ports.open_ports();

        let targets = this.get_target_servers().map(s => this.cache.getServer(s));
        let workers = this.hacks.GetRunnables();

        for (let target of targets) {
            const available_threads = this.hacks.get_available_threads(...workers);
            // If there are not enough threads
            if (available_threads < 5) break;

            // If the server is not at minimum security, start weakening
            if (!target.is_min_security()) await this.weaken(target);
            else if (target.can_hack()) await this.hack(target);
            else if (target.can_grow()) await this.grow(target);
        }

        const left_over_threads = this.hacks.get_available_threads(...workers);

        if (left_over_threads > 100) {

        }

    }

    async weaken(target) {
        const info = await target.smart_weaken();
        let args = [ 
            this.util.formatNum(info.weaken_threads),
            this.util.formatTime(info.time),
            target.host_name 
        ]
        this.ns.tprintf("Weaken > %s threads for %s - %s", ...args);
    }

    async hack(target) {
        const info = await target.smart_hack();
        let args = [
            util.formatNum(info.hack_threads), 
            info.workers, 
            util.formatNum(info.weaken_threads), 
            util.formatTime(info.time), 
            util.formatNum(target.get_money_for_hack(info.hack_threads)),
            Math.floor(target.hack_chance() * 1000)/10,
            target.host_name]; //.map(num => util.formatNum(num));
        // this.ns.tprintf("Weaken > %s threads for %s - %s", ...args);
        this.ns.tprintf("Hack   > %s threads on %s workers | %s counter threads | $%s * %s% @ %s. - %s", ...args);
    

    }

    async grow(target) {
        const info = await target.smart_grow();
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
