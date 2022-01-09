// import * as utils from "/utils/lib.js";
import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";

/** @param {NS} ns **/
export async function main(ns) {

	let ticks = 12;
	while (true) {
		let util = new Util(ns);
		let hacks = new HackUtil(ns);
		let count = ns.getPurchasedServers().length;
		// ns.tprint("AuCurrent Server Count: " + count);
		if (count >= ns.getPurchasedServerLimit()) ns.exit();
		let RAM = calc_next_ram(ns, hacks);
		let price = ns.getPurchasedServerCost(RAM);
		if (ns.getPlayer().money > price) {
			ns.tprintf("Auto Server > Purchasing new server with " + RAM + " GB RAM for $" + price);
			let purchased = ns.purchaseServer(util.purchased_prefix + "_" + count, RAM);
			if (purchased) ns.toast("Purchased new server: " + purchased);
			ticks = 0;
		} else if (ticks >= 12) {
			ns.tprintf("Auto Server > 12 ticks passed without purchase. Next purchase: %s RAM @ $%s", ...([RAM, price].map(n => util.formatNum(n))));
			ticks = 0;
		}
		
		ticks++;
		await ns.sleep(1000 * 10);
	}

}

function calc_next_ram(ns, hacks) {
	let network_ram = hacks.get_max_RAM(...hacks.GetRunnables());
	let target_RAM = 2;
	while (target_RAM < network_ram/4) target_RAM <<= 1;
	return Math.min(target_RAM, ns.getPurchasedServerMaxRam());
}