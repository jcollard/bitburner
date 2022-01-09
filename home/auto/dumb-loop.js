
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
    ns.tprintf("| auto/dumb-loop.js       |");
    ns.tprintf("+-------------------------+");

    let target = "iron-gym";
    while (true) { 
    
        // hack
        ns.tprintf("Hacking %s...", target);
        await ns.exec("/manual/hack.js", "home", 1, target, 900);
        ns.tprintf("Weakening %s...", target);
        await ns.exec("/manual/weaken.js", "home", 1, target, 44);
        await ns.sleep(ns.getWeakenTime(target) + 1000);
        ns.tprintf("Smart Growing %s...");
        await ns.exec("/manual/smart_grow.js", "home", 1, target, 591);
        await ns.sleep(ns.getWeakenTime(target) + 5000);
        
    }

}