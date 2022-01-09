
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

    ns.tprintf("+-------------------+");
    ns.tprintf("| manual/grow.js    |");
    ns.tprintf("+-------------------+");

    if (ns.args.length < 2) util.error("Expected first argument to be a server name and second argument to be the number of threads.");
    let target = cache.getServer(ns.args[0]);
    let threads_needed = await target.run_grow(ns.args[1]);
    let started = ns.args[1] - threads_needed;
    if (threads_needed > 0) {
        ns.tprintf("WARNING: Not enough network RAM to run %s threads.", ns.args[1]);
    }
    
    let finished = target.grow_until - Date.now();
    ns.tprintf("Started %s grow threads. They will finish in %s millis. - %s", util.formatNum(started), util.formatTime(finished), target.host_name);
    

}