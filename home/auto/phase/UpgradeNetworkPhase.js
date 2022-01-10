import SimplePhase from "/auto/phase/SimplePhase.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

export default class UpgradeNetworkPhase extends SimplePhase {

    constructor(ns, hack_percent) {
        super(ns, hack_percent);
    }

   

    async before_processing(workers, available_threads) {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        const server_info = this.net.purchase_server_info(.5);
        info("... Trying to purchase server: %s RAM @ $%s", this.util.formatNum(server_info.RAM), this.util.formatNum(server_info.price));
         // When money is available, grow the network
        this.net.purchase_server(.5);

        super.before_processing(workers, available_threads);

    }
    
    is_complete = () => false;
    
    async next_phase() {
        
    }

    get_target_servers() {
        if (max === undefined) max = 1;
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

        weakest.push(...most_profit);
        return weakest;
    }

}

/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length === 0) {
        ns.tprintf("ERROR: UpgradeNetworkPhase expects hack_percent as first argument.");
        ns.exit();
    }

    let phase = new UpgradeNetworkPhase(ns, ns.args[0]);
    ns.tprintf("Starting Phase Upgrade Network Phase");
    while(true) {
        await phase.tick();
        await ns.sleep(5000);
    }
}