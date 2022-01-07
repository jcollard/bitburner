import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {

	while (true) {
		let hackables = utils.find_all_hackable(ns);
		let max = -1;
		let hacktime = 0;
		let maxServer = "";
		let totalHacks = 0;
		let ticks = 10;

		let best_order = hackables.filter(s => true);
		let ratio = (server) => {
			let time = ns.getHackTime(server);
			let amountPerThread = ns.getServerMoneyAvailable(server) * ns.hackAnalyze(server);
			let chance = ns.hackAnalyzeChance(server);
			let value = (amountPerThread * chance) / time;
			return value;
		};
		// We want the largest value first
		let cmp = (s0, s1) => ratio(s0) - ratio(s1);
		best_order = best_order.sort(cmp).reverse();
		let running = 0;
		for (let server of best_order) {
			if (ns.hackAnalyzeChance(server) < .5) continue;
			if (ns.getServerMoneyAvailable(server) < 500000) continue;
			let amountLeft = (ns.getServerMoneyAvailable(server) / ns.getServerMaxMoney(server));
			if (amountLeft < 0.75) continue;
			if (ns.getRunningScript("/home/hack_target.js", "home")) continue;

			running++;
			let available_ram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
			
			while (available_ram < 128) {
				ns.toast("Tick.", "warning");
				await ns.sleep(1000 * 30);
				available_ram = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
			}
			await ns.exec("/home/hack_target.js", "home", 1, server);
			// ns.toast("Started best hack on: " + server, "info");
		}
		
		// ns.toast("Hacking " + running + " servers.", "info");
		ticks++;
		totalHacks += running;
		if (ticks >= 6) {
			ns.toast("Hack Threads " + totalHacks, "info");
			totalHacks = 0;
			ticks = 0;
		}

		await ns.sleep(1000 * 10);
	}

}