
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
    ns.tprintf("| manual/smart_grow.js    |");
    ns.tprintf("+-------------------------+");

    if (ns.args.length < 1) util.error("Expected first argument to be a server name.");
    let target = cache.getServer(ns.args[0]);
    let threads = ns.args[1];
    let info = await target.smart_grow(threads);
    
    let args = [util.formatNum(info.grow_threads), info.workers, util.formatNum(info.weaken_threads), util.formatTime(info.time), target.host_name]; //.map(num => util.formatNum(num));
    ns.tprintf("Started %s grow threads on %s workers and %s weaken threads. They will finish in %s. - %s", ...args);
    

}