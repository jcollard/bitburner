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
    let money = util.formatNum(ns.getServerMoneyAvailable(target));
    let max_money = util.formatNum(ns.getServerMaxMoney(target));
    let security = util.formatNum(ns.getServerSecurityLevel(target));
    let min_security = util.formatNum(ns.getServerMinSecurityLevel(target));
    let ram = util.formatNum(ns.getServerUsedRam(target));
    let max_ram = util.formatNum(ns.getServerMaxRam(target));

    ns.tprintf("%s", target);
    freport("RAM:", fMinMax(ram, max_ram));
    freport("Money:", fMinMax(money, max_money));
    freport("Hack 10%:", util.formatNum(hacks.calc_hack_threads(target, .1)));
    freport("Hack 25%:", util.formatNum(hacks.calc_hack_threads(target, .25)));
    freport("Hack 50%:", util.formatNum(hacks.calc_hack_threads(target, .50)));
    freport("Hack 90%:", util.formatNum(hacks.calc_hack_threads(target, .90)));
    freport("Growth Factor:", util.formatNum(ns.getServerGrowth(target)));
    freport("Growth % Needed: ", util.formatNum(hacks.calc_max_growth(target)));
    freport("Grow Threads Needed: ", util.formatNum(hacks.calc_grow_threads_needed(target)));
    freport("Security:", fMinMax(security, min_security));
    freport("Weaken Threads Needed: ", util.formatNum(hacks.calc_weaken_threads_needed(target)));
    freport("Active Weaken Threads:", util.formatNum(hacks.get_weaken_threads(target)));
    freport("Active Grow Threads:", util.formatNum(hacks.get_grow_threads(target)));
    freport("Active Hack Threads:", util.formatNum(hacks.get_hack_threads(target)));

    // await ns.alert("Test");
}

function fMinMax(min, max) {
    return NS.sprintf("%s / %s", min, max);
}

function freport(label, data, len) {
    if (len === undefined) len = 32;
    let cLen = label.length + data.length;
    let pad = len - cLen;
    let padded = data.padStart(data.length + pad, " ");
    NS.tprintf("%s%s", label, padded);
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}