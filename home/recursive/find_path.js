import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("First argument should be the target server to find.");
	await ns.prompt(utils.find_path(ns, ns.args[0]));
}