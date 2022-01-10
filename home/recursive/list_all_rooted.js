import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let rooted = utils.find_all_hackable(ns);
	ns.tprintf("%s hackable servers: %s", rooted.length, rooted.join(", "));
}