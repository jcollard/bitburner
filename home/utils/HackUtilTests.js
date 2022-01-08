import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let util = new Util(ns);
    let hacks = new HackUtil(ns);
    // await ns.alert("Runnables: " + HackUtil.GetRunnables());
    // await ns.alert("Meh")
    report("+-------------------+");
    report("| HackUtilsTests.js |");
    report("+-------------------+");
    let availableRAM = hacks.get_available_RAM(...hacks.GetRunnables());
    report("Available RAM: %s GB", util.toMillions(availableRAM));
    let totalRAM = hacks.get_max_RAM(...hacks.GetRunnables());
    report("Total RAM:     %s GB", util.toMillions(totalRAM));
    let threadsToWeaken = hacks.calc_max_threads(HackUtil.HACK_SCRIPT, "n00dles");
    report("Threads to weaken n00dles: %s", threadsToWeaken);
    report("Threads to weaken 10: %s", hacks.calc_threads_to_weaken(10));
    report("Threads to weaken 20: %s", hacks.calc_threads_to_weaken(20));
    report("Threads to weaken 40: %s", hacks.calc_threads_to_weaken(40));
    report("Threads to weaken 80: %s", hacks.calc_threads_to_weaken(80));
    report("Threads to weaken 100: %s", hacks.calc_threads_to_weaken(100));
    report("Max Growth on n00dles: %s", hacks.calc_max_growth("n00dles"));
    report("Max Growth on darkweb: %s", hacks.calc_max_growth("darkweb"));
    report("Threads to reach max money: %s", hacks.calc_grow_threads_needed("n00dles"));
    report("Hackable Servers: %s", hacks.GetHackables().length);


    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}