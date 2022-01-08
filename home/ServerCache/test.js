import ServerCache from "/ServerCache/ServerCache.js";
import HackUtil from "/utils/HackUtil.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let hacks = new HackUtil(ns);
    let cache = new ServerCache(ns);

    report("+---------------------------+");
    report("| ServerCache/test.js       |");
    report("+---------------------------+");

    let predicate = (s) => ns.getServerMoneyAvailable(s) < ns.getServerMaxMoney(s);
    let targets = hacks.GetHackables().filter(predicate);
    let target = cache.getServer("n00dles");
    let batch_threads = target.calc_threads(hacks.get_max_RAM(...hacks.GetRunnables()));
    ns.tprintf("%s needs %s threads", target.host_name, batch_threads);

    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}