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
        await this.ns.spawn("/auto/phase/GrindHackSkillPhase.js", 1, this.hack_percent);
    }

    get_target_servers(max) {
        if (max === undefined) max = 3;
        // Hack servers that have the largest growth rate
        let sVal = s => this.ns.getServerGrowth(s);
        let cmp_weaken = (s0, s1) => sVal(s1) - sVal(s0);
        // Start with servers with the highest security value (weaken new servers)
        let weakest = this.hacks.GetHackables()
            .sort(cmp_weaken).slice(0, 10);
        // this.ns.tprintf("Weakest: %s ", weakest.length)

        // const cmp = (f, rev) => (s0, s1) => rev ? s1 - s0 : s0 - s1;
        // const best_ratio = s => (ns.getServerMaxMoney(s) * ns.hackAnalyze(s)) / ns.getWeakenTime(s);
        // // Then hack the ones that have the highest money ratio
        // let most_profit = this.hacks.GetHackables()
        //     .filter(s => this.cache.getServer(s).is_min_security())
        //     .sort(cmp(best_ratio)).slice(0, max);

        // weakest.push(...most_profit)
        return weakest;
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