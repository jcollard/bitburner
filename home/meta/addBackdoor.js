import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("First argument should be a server name.");
	let hackable = utils.find_all_hackable(ns);
	if (!hackable.includes(ns.args[0])) throw new Error("First argument should be a hackable server.");

	let data = await utils.load_metadata(ns);
	if (data.backdoors.includes(ns.args[0])) throw new Error("Server was already marked as backdoored.");
	data.backdoors.push(ns.args[0]);

	await utils.write_metadata(ns, data);
	
	ns.toast("Backdoor marked.");
}