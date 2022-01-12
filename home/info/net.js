import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import Table from "/utils/Table.js";

let _report = [];
let ns;
let hacks;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);
    hacks = new HackUtil(ns);

    report("+-------------------+");
    report("| net.js            |");
    report("+-------------------+");

    if (ns.args[0] === "list") {
        await process_report(ns.args.slice(1));
        return
    }

    let manifest = {};

    let hackables = hacks.GetHackables();
    let workers = hacks.GetRunnables();
    let ram = util.formatNum(hacks.get_available_RAM(...workers));
    let maxRam = util.formatNum(hacks.get_max_RAM(...workers));
    let threads = util.formatNum(hacks.get_available_threads(...workers));
    let maxThreads = util.formatNum(hacks.get_max_threads(...workers));


    ns.tprintf("Hackable Servers: %s", hackables.length);
    ns.tprintf("Worker Servers: %s", workers.length);
    ns.tprintf("Network RAM: %s / %s GB", ram, maxRam);
    ns.tprintf("Network Threads: %s / %s", threads, maxThreads);

    


    // await ns.alert("Test");
}

const cmp = (f, desc) => (s0, s1) => desc ? f(s1) - f(s0) : f(s0) - f(s1);
const sort_options = {
    "money_ratio": (s) => (1000 * ns.getServerMaxMoney(s) * ns.hackAnalyze(s)) / ns.getWeakenTime(s),
};

async function process_report(args) {
    const options = ns.flags([
        ['sort_by', "money_ratio"],
        ['limit', 10]
    ]);

    const sort_f = sort_options[options["sort_by"]];
    const limit = options["limit"];
    const workers = hacks.GetHackables()
                         .sort(cmp(sort_f, true))
                         .slice(0, limit ? limit : 100);
    const table = new Table(ns);
    table.add_column("ID", workers.map((_, ix) => ix));
    table.add_column("HOST", workers, true);
    table.add_column("WEAK", workers.map(w => hacks.get_weaken_threads(w)));
    table.add_column("GROW", workers.map(w => hacks.get_grow_threads(w)));
    table.add_column("HACK", workers.map(w => hacks.get_hack_threads(w)));
    table.add_column("SECURITY", workers.map(s => ns.sprintf("%.2f", ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s))));
    // add_column("$ AVAILABLE", workers.map(s => "$" + util.formatNum(ns.getServerMoneyAvailable(s))));
    table.add_column("$", workers.map(s => "$" + util.formatNum(ns.getServerMaxMoney(s),1)));
    table.add_column("%", workers.map(s => util.formatNum(ns.hackAnalyzeChance(s),0, 5)));
    table.add_column("t", workers.map(s => util.formatTime(ns.getWeakenTime(s))));
    const ratio = (s) => (1000 * ns.getServerMaxMoney(s) * ns.hackAnalyze(s)) / ns.getWeakenTime(s);
    table.add_column("($ * %)/s", workers.map(s => "$" + util.formatNum(ratio(s),2)));

    await table.aprint();

}

function report(str, ...values) {
    ns.tprintf(str, ...values);
}