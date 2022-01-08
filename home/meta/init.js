import Util from "/utils/Util.js";

/** @param {NS} ns **/
export async function main(ns) {
	let util = new Util(ns);
	// let data = {
	// 	backdoors: []
	// };
	// await utils.write_metadata(ns, data);
	await util.init_backdoors();
	ns.toast("Metadata initialized.");
}