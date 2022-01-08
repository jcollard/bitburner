import ServerCache from "/ServerCache/ServerCache.js";
import HackUtil from "/utils/HackUtil.js";
import Util from "/utils/Util.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let hacks = new HackUtil(ns);
    let util = new Util(ns);

    report("+---------------------------+");
    report("| ServerCache/prep.js       |");
    report("+---------------------------+");

    if (ns.args.length == 0) util.error("Expected first argument to be a server name.");
    let money_cap = ns.args[1];
    let cache = new ServerCache(ns, money_cap);
    let target = cache.getServer(ns.args[0]);
    
    

    ns.tprintf("Target: %s", target.host_name);
    ns.tprintf("  Is Prepped: %s", target.is_prepped());
    while (!target.is_prepped()) {
        ns.tprintf("Prepping %s for batch.", target.host_name);
        if(!await target.prep_for_batch()) {
            ns.tprintf("WARNING: There wasn't enough memory to prep in one try. This may take awhile.");
        }
        let time = util.formatNum(target.prep_until - Date.now());
        ns.tprintf("Prep started. Waiting %s ms", time);
        await ns.sleep(target.prep_until - Date.now());
    }
    
    ns.tprintf("%s is prepped!", target.host_name);
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}