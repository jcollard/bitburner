import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let target = ns.args[0];
	if (!utils.find_all_servers(ns).includes(target)) throw new Error ("First argument must be a server.");
	let percent_take = ns.hackAnalyze(target);
	// Take 25%
	let threads_needed = Math.ceil(0.25 / percent_take);
	
	let hack_script = "/simple/hack.js";

	let max_threads_on_server = get_max_threads(ns, "home", hack_script);
	let threads_to_start = Math.min(threads_needed, max_threads_on_server);
	await start_script_on_server(ns, threads_to_start, hack_script, "home", target);
	

}

async function start_script_on_server(ns, threads, script, runner, target) {
	await ns.scp(script, "home", runner);
	await ns.exec(script, runner, threads, target);
}

function get_max_threads(ns, server, script) {
	let needed_ram = ns.getScriptRam(script, "home");
	// Always save 64 GB of ram
	let available_ram = get_available_ram(ns, server) - 64;
	let max_threads = Math.floor(available_ram / needed_ram);
	return max_threads;
}

function get_available_ram(ns, server) {
	return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}