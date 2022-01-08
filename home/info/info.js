import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let util = new Util(ns);
    let hacks = new HackUtil(ns);

    report("+-------------------+");
    report("| info.js           |");
    report("+-------------------+");

    if (ns.args.length == 0) throw new Error("Expected first argument to be a server name.");
    let target = ns.args[0];
    let money = util.toMillions(ns.getServerMoneyAvailable(target));
    let max_money = util.toMillions(ns.getServerMaxMoney(target));
    let security = ns.getServerSecurityLevel(target);
    let min_security = ns.getServerMinSecurityLevel(target);
    let ram = ns.getServerUsedRam(target);
    let max_ram = ns.getServerMaxRam(target);

    ns.tprintf("%s", target);
    ns.tprintf("RAM: %s / %s", ram, max_ram);
    ns.tprintf("Money: %s / %s", money, max_money);
    ns.tprintf("Security: %s / %s", security, min_security);


    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}