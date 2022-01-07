/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("First argument should be a server to weaken.");
	await ns.weaken(ns.args[0]);
}