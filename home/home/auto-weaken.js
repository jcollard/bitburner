import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let available_ram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");

	let report_weaken = 0;
	let ticks = 10;

	while (true) {
		let hackables = utils.find_all_hackable(ns);
		let threads = 0;
		for (let server of hackables) {
			// Skip the same thread
			if (ns.scriptRunning("/simple/grow.js", "home")) continue;

			while (available_ram < 128) {
				ns.toast("Tick.", "warning");
				await ns.sleep(1000 * 30);
				available_ram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
			}

			threads += await weaken(ns, server);

		}

		report_weaken += threads;
		ticks++;
		if (ticks >= 6) {
			ns.toast("Weaken Threads " + report_weaken, "info");
			report_weaken = 0;
			ticks = 0;
		}
		await ns.sleep(1000 * 10);
	}

}

async function weaken(ns, target) {
	let threads_needed = calc_threads_to_weaken(ns, target);
	let total_needed = threads_needed;
	if (total_needed === 0) return 0;
	// ns.toast("Need " + total_needed + " threads needed to weaken " + target, "info");
	let weaken_script = "/simple/weaken.js";

	let max_threads_on_server = get_max_threads(ns, "home", weaken_script);
	let threads_to_start = Math.min(threads_needed, max_threads_on_server);
	await start_script_on_server(ns, threads_to_start, weaken_script, "home", target);
	return threads_to_start;
}

async function start_script_on_server(ns, threads, script, runner, target) {
	await ns.exec(script, "home", threads, target);
}

function get_max_threads(ns, server, script) {
	let needed_ram = ns.getScriptRam(script, "home");
	let available_ram = get_available_ram(ns, server) - 128;
	let max_threads = Math.floor(available_ram / needed_ram);
	return max_threads;
}

function get_available_ram(ns, server) {
	return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}

function calc_threads_to_weaken(ns, server) {
	let currSec = ns.getServerSecurityLevel(server);
	let minSec = ns.getServerMinSecurityLevel(server);
	let targetDecrease = currSec - minSec;

	if (currSec > minSec) {
		let threads = 1;
		// let decrease = ns.weakenAnalyze(threads);
		while (ns.weakenAnalyze(threads++) < targetDecrease);
		return threads;
	}
	return 0;
}