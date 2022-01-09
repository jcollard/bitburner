import Util from "/utils/Util.js";

/** @param {NS} ns **/
export async function main(ns) {

	let util = new Util(ns);
	
	let max_ram = ns.getPurchasedServerMaxRam()/16;
	let upgrade_cost = ns.getPurchasedServerCost(max_ram);
	ns.tprintf("Auto Upgrade On > Will automatically upgrade to %s RAM when $%s is available.", util.formatNum(max_ram), util.formatNum(upgrade_cost));

	top:
	while (true) {
		await ns.sleep(1000 * 5);
		//let purchased_servers = utils.find_all_purchased(ns);
		let servers = ns.getPurchasedServers();
		if (ns.getPlayer().money <= upgrade_cost) continue;

		for (let server of servers) {
			if (ns.getServerMaxRam(server) < max_ram) {
				ns.toast("Upgrade " + server + " for $" + util.formatNum(upgrade_cost) + "?");
				ns.killall(server);
				ns.deleteServer(server);
				ns.purchaseServer(server, max_ram);
				continue top;
			}
		}

		ns.toast("All servers upgraded.");
		break;
	}
}