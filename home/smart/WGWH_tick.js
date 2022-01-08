import WGWH from "/smart/WGWH.js";
import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let util = new Util(ns);
    let hacks = new HackUtil(ns);
    // let wgwh = new WGWH(ns);

    report("+-------------------+");
    report("| WGWH_tick.js       |");
    report("+-------------------+");

    // await wgwh.tick();

    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}