import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {


	while (true) {
		let RAM = 1024;
		let count = ns.getPurchasedServers().length;
		ns.toast("Count: " + count);
		if (count >= ns.getPurchasedServerLimit()) ns.exit();
		if (count < 4) RAM <<= 1
		else if (count < 8) RAM <<= 4
		else if (count < 12) RAM <<= 8
		else RAM = ns.getPurchasedServerMaxRam() / 8;
		// await ns.prompt("RAM: " + RAM);
		// ns.exit();
		let price = Math.ceil((ns.getPurchasedServerCost(RAM) / 100000)) / 10;
		ns.toast("Trying to purchase new server with " + RAM + " GB RAM for " + price + " m", "info");
		let purchased = ns.purchaseServer(utils.purchased_prefix + "_" + count, RAM);
		if (purchased) ns.toast("Purchased new server: " + purchased);
		
		await ns.sleep(1000 * 60);
	}

}