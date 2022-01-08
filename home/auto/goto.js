import Util from "/utils/Util.js";
import Singularity from "/utils/Singularity.js";

/** @param {NS} ns **/
export async function main(ns) {
	let util = new Util(ns);
	let singularity = new Singularity(ns);
	if (ns.args.length == 0) util.error("First argument should be a server name");
	singularity.goto(ns.args[0]);
	// await execute_terminal(ns, utils.find_path(ns, ns.args[0]));

}