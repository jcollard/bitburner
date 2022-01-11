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
        this.max_servers = 3;
        this.increase_max_ticks = 0;
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

    async end_of_tick(left_over_threads) {
        this.increase_max_ticks += left_over_threads > 100 ? 1 : -1;
        this.increase_max_ticks = Math.max(this.increase_max_ticks, 0);
        if (this.increase_max_ticks > 10) {
            this.tprintf("Upgrade Network Phase > Increasing the maximum servers checked.");
            this.max_servers++;
            this.increase_max_ticks = 0;
        }
    }
    
    is_complete = () => false;
    
    async next_phase() {
        
    }

    get_target_servers() {
        return super.get_target_servers(70);
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