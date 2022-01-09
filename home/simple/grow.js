/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("First argument should be a server to weaken.");
	if (ns.args[1]) await ns.sleep(ns.args[1]);
	await ns.grow(ns.args[0]);
}