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
    report("| net.js            |");
    report("+-------------------+");

    let manifest = {};

    let hackables = hacks.GetHackables();
    let workers = hacks.GetRunnables();
    let ram = util.formatNum(hacks.get_available_RAM(...workers));
    let maxRam = util.formatNum(hacks.get_max_RAM(...workers));


    ns.tprintf("Hackable Servers: %s", hackables.length);
    ns.tprintf("Worker Servers: %s", workers.length);
    ns.tprintf("Network RAM: %s / %s GB", ram, maxRam);


    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}