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
    let cache = new ServerCache(ns);

    report("+---------------------------+");
    report("| ServerCache/prep.js       |");
    report("+---------------------------+");

    if (ns.args.length == 0) util.Error("ERROR: Expected first argument to be a server name.");
    let target = cache.getServer(ns.args[0]);
    ns.tprintf("Target: %s", target.host_name);
    ns.tprintf("  Is Prepped: %s", target.is_prepped());
    if (target.is_prepped()) {
        ns.tprintf("Target is prepped!");
        ns.exit();
    }
    await target.prep_for_batch();
    // ns.tprintf("%s needs %s threads to batch $%s raw and %s ratio.", target.host_name, batch_info.total_threads, util.toMillions(batch_info.amount), util.toMillions(batch_info.ratio));

    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}