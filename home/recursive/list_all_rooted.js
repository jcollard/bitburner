import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let rooted = utils.find_all_hackable(ns);
	ns.prompt(rooted.length + " hackable servers: " + rooted.join(", "));
}