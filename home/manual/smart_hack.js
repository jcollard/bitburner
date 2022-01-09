
import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let util = new Util(ns);
    let hacks = new HackUtil(ns);
    let cache = new ServerCache(ns);

    ns.tprintf("+-------------------------+");
    ns.tprintf("| manual/smart_hack.js    |");
    ns.tprintf("+-------------------------+");

    if (ns.args.length < 1) util.error("Expected first argument to be a server name.");
    let target = cache.getServer(ns.args[0]);
    let threads = ns.args[1];
    let type = threads ? threads + " threads" : "25%";
    ns.tprintf("Smart Hack - %s" )
    let info = await target.smart_hack(0.25, threads);
    
    let args = [util.formatNum(info.hack_threads), info.workers, util.formatNum(info.weaken_threads), util.formatTime(info.time), target.host_name]; //.map(num => util.formatNum(num));
    ns.tprintf("Started %s hack threads on %s workers and %s weaken threads. They will finish in %s. - %s", ...args);
    

}