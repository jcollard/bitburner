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
        // Use the 3 servers with the highest growth rate
        let cmp = (s0, s1) => this.ns.getServerGrowth(s0) - this.ns.getServerGrowth(s1);
        return this.hacks.GetHackables()
            .filter(s => this.cache.getServer(s).max_money() > 0)
            .sort(cmp)
            .slice(0, 10);
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