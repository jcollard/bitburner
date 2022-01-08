import Util from "/utils/Util.js";

let _report = [];
let NS;

/** @param {NS} ns **/
export async function main(ns) {
    NS = ns;
    let util = new Util(ns);

    report("+-------------------+");
    report("| find.js           |");
    report("+-------------------+");

    if (ns.args.length == 0) throw new Error("Expected first argument to be a server name.");
    let target = ns.args[0];
    report(util.find_path(target));

}

function report(str, ...values) {
    NS.tprintf(str, ...values);
}