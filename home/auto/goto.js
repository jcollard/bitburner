import execute_terminal from "/utils/run_command.js";
import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("First argument should be a server name");
	await execute_terminal(ns, utils.find_path(ns, ns.args[0]));
}