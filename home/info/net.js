import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

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

    await process_report();


    // await ns.alert("Test");
}

async function process_report() {
    const workers = hacks.GetHackables();
    let columns = [];
    const header = (ls, h) => { 
        let newLS = ls.filter(s => true);
        newLS.unshift(h); 
        return newLS; 
    }
    const str_id = x => "" + x;
    const find_pad = ls => ls.reduce((acc, str) => Math.max(str.length, acc), 0);
    const add_column = (h, ls, start, selector) => { 
        ls = header(ls, h);
        selector = selector ? selector : str_id;
        let pad = find_pad(ls.map(selector)); 
        let do_pad = s => start ? s.padEnd(pad) : s.padStart(pad); 
        let result = ls.map(w => do_pad(selector(w)));
        columns.push(result);
        return result; 
    };
    add_column("ID", workers.map((_, ix) => ix));
    add_column("HOST", workers, true);
    add_column("WEAK", workers.map(w => hacks.get_weaken_threads(w)));
    add_column("GROW", workers.map(w => hacks.get_grow_threads(w)));
    add_column("HACK", workers.map(w => hacks.get_hack_threads(w)));
    add_column("SECURITY", workers.map(s => ns.sprintf("%.2f", ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s))));
    // add_column("$ AVAILABLE", workers.map(s => "$" + util.formatNum(ns.getServerMoneyAvailable(s))));
    add_column("$", workers.map(s => "$" + util.formatNum(ns.getServerMaxMoney(s),1)));
    add_column("%", workers.map(s => util.formatNum(ns.hackAnalyzeChance(s),0, 5)));
    add_column("t", workers.map(s => util.formatTime(ns.getWeakenTime(s))));
    const ratio = (s) => (1000 * ns.getServerMaxMoney(s) * ns.hackAnalyze(s)) / ns.getWeakenTime(s);

    add_column("($ * %)/s", workers.map(s => "$" + util.formatNum(ratio(s),2)));

    // const elems =  [ixs, names, weaken_threads, grow_threads, hack_threads];
    const message = columns.map(s => "%s").join(" | ");
    ns.tprint(columns.length);

    for(let ix = 0; ix < columns[0].length; ix++) {
        // ns.ps(workers[ix]);
        let args = columns.map( x => x[ix] );
        ns.tprintf(message, ...args)
        await ns.sleep(10);
    }

}

function report(str, ...values) {
    ns.tprintf(str, ...values);
}