import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let rooted = utils.find_all_servers(ns);
	ns.prompt(rooted.length + " servers: " + rooted.join(", "));
}