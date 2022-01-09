import * as utils from "/utils/lib.js";
import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";

let data = {};
let notifications = "";
let hack_percent = 0.10;
let min_percent = 0.10;
let max_percent = 0.90;
let hack_increments = 0;
let min_threads = 0;
let max_grow_money = 0;
let util;
let hacks;
let cache;

/** @param {NS} ns **/
export async function main(ns) {
	util = new Util(ns);
	hacks = new HackUtil(ns);
	cache = new ServerCache(ns);
	if (ns.args.length > 0) {
		hack_percent = Number(ns.args[0]);
		ns.toast("Started with hack_percent: " + hack_percent);
	}

	if (ns.args.length > 1) {
		min_threads = Number(ns.args[1]);
		ns.toast("Started with min_threads: " + min_threads);
	}

	let hackables = utils.find_all_hackable(ns);
	ns.toast("Found " + hackables.length + " hackable servers.", "info");

	let workers = utils.find_all_runnable(ns);
	let total_ram = workers.reduce((prev, s) => prev + ns.getServerMaxRam(s), 0);
	ns.toast("Total RAM available: " + total_ram + "GB", "info");

	// ns.toast("Stopping all threads globally", "info");
	// clear_servers(ns, workers);
	let next_weaken_at = {};
	let next_grow_at = {};
	let next_hack_at = {};

	// ns.tprintf("WARNING STILL IGNORING n00dles!");
	while (true) {
		max_grow_money = Math.max(100_000, (ns.getPlayer().money/8));
		hackables = utils.find_all_hackable(ns).filter((s) => s !== "n00dles");
		workers = sort_workers(ns, utils.find_all_runnable(ns));
		let reverse_workers = workers.filter(s => true).reverse();

		notifications = "";
		// Try to weaken
		if (hacks.get_available_RAM(...hacks.GetRunnables()) > 50)
			await weaken_hackables(ns, hackables, reverse_workers, next_weaken_at);
		// Try hack
		if (hacks.get_available_RAM(...hacks.GetRunnables()) > 50)
			await hack_hackables(ns, hackables, workers, next_hack_at);
		// Try to grow (only grow if 100% weakend)
		if (hacks.get_available_RAM(...hacks.GetRunnables()) > 50)
			await grow_hackables(ns, hackables, workers, next_grow_at);

		if (hacks.get_available_threads(...workers) > 100 && hack_percent < max_percent) {
			hack_increments++;
			hack_percent = min_percent + 0.025 * hack_increments;
			hack_percent = Math.min(max_percent, hack_percent);
			ns.tprintf("Over 100 available threads left over, increasing hack_percent to %s", hack_percent);
		} else if (hack_percent > min_percent) {
			hack_increments--;
			hack_increments = Math.max(0, hack_increments);
			hack_percent = min_percent + 0.025 * hack_increments;
			hack_percent = Math.max(min_percent, hack_percent);
			ns.tprintf("Not enough threads, decreasing hack_percent to %s ", hack_percent);
		}

		await ns.sleep(1000 * 10);
	}

}

function sort_workers(ns, workers) {
	let cmp = (s0, s1) => (get_available_ram(ns, s0) - get_available_ram(ns, s1));
	return workers.sort(cmp).reverse();

}

async function wait_for_ram(ns, workers) {
	while (get_all_available_ram(ns, workers) < 8) {
		ns.toast("Out of RAM, waiting 30 seconds.");
		await ns.sleep(1000 * 30);
	}
}

function get_all_available_ram(ns, workers) {
	return workers.reduce((prev, s) => prev + (get_available_ram(ns, s)));
}

function clear_servers(ns, workers) {
	for (let server of workers) {
		ns.killall(server);
	}
}

async function weaken_hackables(ns, hackables, workers, next_weaken_at) {
	// Sort such that servers such that servers that can be at 0 security are first.
	let count = 0;
	let sVal = (s) => (ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s)) * ns.getWeakenTime;
	let cmp = (s0, s1) => sVal(s0) - sVal(s1);
	let weakestFirst = hackables
	// Only weaken servers that are above the minimum threshold.
	.filter(s => (ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s)) >= 1.5)
	// Only weaken servers need additional weakening
	.filter(s => (cache.getServer(s).calc_weaken_threads() > 0))
	.sort(cmp);
		
	ns.tprintf("Try to weaken %s", weakestFirst.join(", "));
	for (let target of weakestFirst) {
		if (hacks.get_available_RAM(...hacks.GetRunnables()) < hacks.WEAKEN_RAM()) return count;
		// Only run weaken on the target if it has finished executing
		if (target in next_weaken_at) {
			let currTime = Date.now();
			if (next_weaken_at[target] > currTime) continue;
		}
		next_weaken_at[target] = await weaken(ns, target, workers);
		if (next_weaken_at[target] > 0) count++;
	}
	return count;
}

async function grow_hackables(ns, hackables, workers, next_grow_at) {
	
	let count = 0;
	// Favor servers with the best growth %
	let sVal = (server) => ns.getServerGrowth(server); 
	let cmp = (s0, s1) => sVal(s0) - sVal(s1);
	let closestFirst = hackables
		// Only grow servers that are close to minimum security
		.filter(s => (ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s)) < 2)
		// Only grow servers that need grow threads
		.filter(s => cache.getServer(s).calc_grow_threads() > 0)
		.sort(cmp).reverse();
		
	ns.tprintf("Considering grow on %s", closestFirst.join(", "));
	for (let target of closestFirst) {
		if (hacks.get_available_RAM(...hacks.GetRunnables()) < hacks.GROW_RAM()) return count;
		let entry = cache.getServer(target);
		let info = await entry.smart_grow();
		if (info.grow_threads === 0) {
			continue;
		}
		let args = [util.formatNum(info.grow_threads), info.workers, util.formatNum(info.weaken_threads), util.formatTime(info.time), entry.host_name]; //.map(num => util.formatNum(num));
    	ns.tprintf("... Started %s grow threads on %s workers and %s weaken threads. They will finish in %s. - %s", ...args);
		next_grow_at[target] = Date.now() + info.time;

	}
	return count;
}

async function hack_hackables(ns, hackables, workers, next_hack_at) {
	// Sort such that the money earned to time spent ratio is the highest
	let count = 0;
	let highest_profit_ratio = find_best_ratio(ns, hackables)
		// Only hack servers that are weakened
		// Only grow servers that are close to minimum security
		.filter(s => (ns.getServerSecurityLevel(s) - ns.getServerMinSecurityLevel(s)) < 2)
		// Only hack servers with a decent probability of being successful
		.filter(s => ns.hackAnalyzeChance(s) >= 0.5)
		// Only hack servers that are not currently being hacked
		.filter(s => hacks.get_hack_threads(s) === 0)
		// Only hack servers that are fully grown.
		.filter(s => ns.getServerMoneyAvailable(s) == ns.getServerMaxMoney(s))
		.filter(s => ns.getServerMoneyAvailable(s) > 0);

	ns.tprintf("Considering hack on %s", highest_profit_ratio.join(", "));
	for (let target of highest_profit_ratio) {
		let available_ram = hacks.get_available_RAM(...hacks.GetRunnables());
		if (available_ram < hacks.HACK_RAM()) return count;
		
		let entry = cache.getServer(target);
		let info = await entry.smart_hack(hack_percent);
		if (info.hack_threads === 0) {
			continue;
		}
		let expected_money = info.hack_threads * ns.getServerMoneyAvailable(target) * ns.hackAnalyze(target);
		let chance = ns.hackAnalyzeChance(target) * 100;
		let args = [
			util.formatNum(info.hack_threads), 
			info.workers, 
			util.formatNum(info.weaken_threads), 
			util.formatNum(chance),
			util.formatNum(expected_money),
			util.formatTime(info.time), 
			entry.host_name]; //.map(num => util.formatNum(num));
    	ns.tprintf("... Started %s hack threads on %s workers and %s weaken threads. %s%% chance of $%s in %s. - %s", ...args);
		next_hack_at[target] = Date.now() + info.time;
	}
	return count;
}

function find_best_ratio(ns, hackables) {
	let best_order = hackables.filter(s => true);
	// Select the servers with the highest growth factor first, they will be easier to regrow.
	let ratio = (server) => ns.getServerGrowth(server); 
	// 	let time = ns.getWeakenTime(server);
	// 	let amountPerThread = ns.getServerMoneyAvailable(server) * ns.hackAnalyze(server);
	// 	let chance = ns.hackAnalyzeChance(server);
	// 	let value = (amountPerThread * chance) / time;
	// 	return value;
	// };
	// We want the largest value first
	let cmp = (s0, s1) => ratio(s0) - ratio(s1);
	best_order = best_order.sort(cmp).reverse();
	return best_order;
}

async function weaken(ns, target, workers) {
	let threads_needed = Math.max(min_threads, calc_threads_to_weaken(ns, target));
	let total_needed = threads_needed;
	if (total_needed === 0) return 0;
	// ns.toast("Need " + total_needed + " threads needed to weaken " + target, "info");
	let weaken_script = "/simple/weaken.js";
	while (threads_needed > 0) {
		let runner = await find_next_free_server(ns, weaken_script, workers);
		if (runner === undefined) break;
		let max_threads_on_server = get_max_threads(ns, runner, weaken_script);
		let threads_to_start = Math.min(threads_needed, max_threads_on_server);
		await start_script_on_server(ns, threads_to_start, weaken_script, runner, target);
		threads_needed -= threads_to_start;
	}
	let started = total_needed - threads_needed;
	ns.tprintf("... Started %s weaken threads taking %s - " + target, util.formatNum(started), util.formatTime(ns.getWeakenTime(target)));
	return Date.now() + ns.getWeakenTime(target);
}

async function grow(ns, target, workers) {
	if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) return 0;
	let max_money = ns.getServerMaxMoney(target);
	let curr_money = ns.getServerMoneyAvailable(target);
	if (curr_money === max_money) return 0;
	if (max_money === 0) {
		ns.toast("0 Money available at " + target);
		return 0;
	}
	let growthNeeded = 1;
	let threads_needed = Math.max(min_threads, 50000);
	if (curr_money !== 0) {
		growthNeeded = max_money / curr_money;
		threads_needed = Math.max(min_threads, Math.ceil(ns.growthAnalyze(target, growthNeeded)));
	}

	if (threads_needed == 0) return Date.now();
	let total_needed = threads_needed;
	let grow_script = "/simple/grow.js";
	while (threads_needed > 0) {
		let runner = await find_next_free_server(ns, grow_script, workers);
		if (runner === undefined) break;
		let max_threads_on_server = get_max_threads(ns, runner, grow_script);
		let threads_to_start = Math.min(threads_needed, max_threads_on_server);
		await start_script_on_server(ns, threads_to_start, grow_script, runner, target);
		threads_needed -= threads_to_start;
	}
	let started = total_needed - threads_needed;
	let args = [started, ns.getGrowTime(target)].map(s => util.formatNum(s));
	ns.tprintf("... Started %s grow threads taking %s millis - " + target, ...args);
	return Date.now() + ns.getGrowTime(target);
}

async function hack(ns, target, workers) {
	if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) return 0;
	let curr_money = ns.getServerMoneyAvailable(target);
	let max_money = ns.getServerMaxMoney(target);
	if (max_money === 0) return 0;
	let hack_amount = Math.min(max_grow_money, max_money * .50);
	let args = [curr_money, max_money, hack_amount].map(n => util.formatNum(n));
	if (curr_money < hack_amount) return 0;
	let desired_amount = curr_money * hack_percent;
	let threads_needed = Math.max(min_threads, Math.ceil(ns.hackAnalyzeThreads(target, desired_amount)));

	let total_needed = threads_needed;
	if (total_needed === 0) return 0;
	let hack_script = "/simple/hack.js";
	while (threads_needed > 0) {
		let runner = await find_next_free_server(ns, hack_script, workers);
		if (runner === undefined) break;
		let max_threads_on_server = get_max_threads(ns, runner, hack_script);
		let threads_to_start = Math.min(threads_needed, max_threads_on_server);
		await start_script_on_server(ns, threads_to_start, hack_script, runner, target);
		threads_needed -= threads_to_start;
	}
	let started = total_needed - threads_needed;
	let money = started * ns.hackAnalyze(target) * curr_money;
	let time = ns.getHackTime(target);
	let chance = (ns.hackAnalyzeChance(target)) * 100;
	args = [started, money, chance, time].map(n => util.formatNum(n));
	ns.tprintf("... Started %s Hack threads. Expect $%s @ %s%% in %s millis - " + target, ...args);
	return Date.now() + ns.getHackTime(target);
}

async function start_script_on_server(ns, threads, script, runner, target) {
	await ns.scp(script, "home", runner);
	await ns.exec(script, runner, threads, target);
}

function get_max_threads(ns, server, script) {
	let needed_ram = ns.getScriptRam(script, "home");
	let available_ram = get_available_ram(ns, server);
	let max_threads = Math.floor(available_ram / needed_ram);
	return max_threads;
}

// Returns a server with enough ram to run the specified script
// If no such server exists, returns undefined
async function find_next_free_server(ns, script, workers) {
	let needed_ram = ns.getScriptRam(script, "home");
	for (let server of workers) {
		if (get_available_ram(ns, server) >= needed_ram) return server;
	}
	ns.toast("Tick - Out of Server RAM", "warning");
	await ns.sleep(1000 * 10);
	return undefined;
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