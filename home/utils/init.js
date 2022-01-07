import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let data = {
		backdoors: []
	};
	await utils.write_metadata(ns, data);
	ns.toast("Metadata initialized.");
}