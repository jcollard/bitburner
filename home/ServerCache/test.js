import ServerCache from "/ServerCache/ServerCache.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let cache = new ServerCache(ns);

    report("+---------------------------+");
    report("| ServerCache/test.js       |");
    report("+---------------------------+");

    let target = cache.getServer("n00dles");

    report("%s is prepped? %s", target.host_name, target.is_prepped());
    await target.prep_for_batch();

    // await ns.alert("Test");
}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}