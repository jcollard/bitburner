import ServerCache from "/ServerCache/ServerCache.js";
import HackUtil from "/utils/HackUtil.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let cache = new ServerCache(ns);

    report("+---------------------------+");
    report("| ServerCache/test.js       |");
    report("+---------------------------+");

    let predicate = (s) => ns.getServerMoneyAvailable(s) < ns.getServerMaxMoney(s);
    let targets = new HackUtil(ns).GetHackables().filter(predicate);
    while (true) {
        
        for (let i = 0; i < 10; i++) {
            let target = cache.getServer(targets[i]);
            
            await target.tick();
        }
        
        await ns.sleep(5000);
    }

    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}