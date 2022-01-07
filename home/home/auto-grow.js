import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let available_ram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");


	let report_growth = 0;
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

			threads += await grow(ns, server);

		}

		report_growth += threads;
		ticks++;
		if (ticks >= 6) {
			ns.toast("Growth Threads " + report_growth, "info");
			report_growth = 0;
			ticks = 0;
		}		await ns.sleep(1000 * 10);
	}

}

async function grow(ns, target) {
	let max_money = ns.getServerMaxMoney(target);
	let curr_money = ns.getServerMoneyAvailable(target);
	if (curr_money === 0) {
		//ns.toast("0 Money available at " + target);
		return 0;
	}
	let growthNeeded = max_money / curr_money;
	let threads_needed = Math.ceil(ns.growthAnalyze(target, growthNeeded));
	if (threads_needed == 0) return 0;
	let total_needed = threads_needed;
	let grow_script = "/simple/grow.js";

	let max_threads_on_server = get_max_threads(ns, "home", grow_script);
	let threads_to_start = Math.min(threads_needed, max_threads_on_server);
	await start_script_on_server(ns, threads_to_start, grow_script, "home", target);
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