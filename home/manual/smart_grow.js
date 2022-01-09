
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
    let info = target.smart_grow();
    
    let args = [info.grow_threads, info.weaken_threads, info.time].map(num => util.formatNum(num));
    args.push(target.host_name);
    ns.tprintf("Started %s grow threads and %s weaken threads. They will finish in %s millis. - %s", ...args);
    

}