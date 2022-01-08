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
    freport("Security:", fMinMax(security, min_security));


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