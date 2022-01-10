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
export default class GrindHackSkillPhase extends SimplePhase {

    constructor(ns) {
        super(ns);
    }

    // async process(target, available_threads, workers) {
    //     this.hack_percent = .9;
    //     if (available_threads < 5) return;

    //     let weaken_info = await this.weaken(target);
    //     await this.ns.sleep(100);
    //     let grow_info = await this.grow(target);
    //     await this.ns.sleep(100);
    //     let hack_info = await this.hack(target);
    //     let threads = weaken_info.weaken_threads + grow_info.grow_thread + grow_info.weaken_threads + hack_info.hack_threads + hack_info.weaken_threads;
    //     let diff = available_threads - threads;
    //     if (diff > 0) {
    //         await target.smart_weaken(diff);
    //     }
    // }

    // Get servers that have the shortest hack time.
    get_target_servers(max) {
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

        weakest.push(...most_profit)
        return weakest;
    }


}

/** @param {NS} ns **/
export async function main(ns) {
    let phase = new GrindHackSkillPhase(ns);
    ns.tprintf("Starting GrindHackSkillPhase Phase");
    while (true) {
        await phase.tick();
        await ns.sleep(5000);
    }
}