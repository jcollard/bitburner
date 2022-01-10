import SimplePhase from "/auto/phase/SimplePhase.js";

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
export default class UpgradePortsPhase extends SimplePhase {

    constructor(ns){
        super(ns);
    }

    async before_processing(workers, available_threads) {
        const info = (str, ...args) => undefined;
        // const info = (str, ...args) => debug(str, ...args);
        info("... Trying to purchase programs: %s", this.ports.needed_programs());
        // Try to upgrade port programs
        this.ports.purchase_all_programs();
        super.before_processing(workers, available_threads);

    }

    is_complete = () => this.ports.needed_programs().length === 0;
    
    async next_phase() {
        this.ns.tprintf("UpgradePortsPhase > Finished Phase, spawning UpgradeNetworkPhase");
        await this.ns.spawn("/auto/phase/UpgradeNetworkPhase.js", 1, this.hack_percent);
    }

}

/** @param {NS} ns **/
export async function main(ns) {
    let phase = new UpgradePortsPhase(ns);
    ns.tprintf("Starting Phase Upgrade Ports Phase");
    while(true) {
        await phase.tick();
        if (phase.is_complete()) {
            await phase.next_phase();
        }
        await ns.sleep(5000);
    }
}