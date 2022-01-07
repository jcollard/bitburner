import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {

	//let purchased_servers = utils.find_all_purchased(ns);
	let servers = ns.getPurchasedServers();
	let max_ram = ns.getPurchasedServerMaxRam();
	let upgrade_cost = Math.ceil(ns.getPurchasedServerCost(max_ram)/1000000000);
	
	for (let server of servers) {
		if (ns.getServerMaxRam(server) < max_ram) {
			if (await ns.prompt("Upgrade " + server + " for " + upgrade_cost + " b?")){
				ns.killall(server);
				ns.deleteServer(server);
				ns.purchaseServer(server, max_ram);
			}
			return;
		}
	}

	ns.prompt("No servers could be upgraded.");

}