import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let rooted = utils.find_all_servers(ns);
	ns.tprintf("%s servers: %s", rooted.length, rooted.join(", "));
}