import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {

		while (ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
			let ix = ns.hacknet.purchaseNode();
			// let upCost = ns.hacknet.getLevelUpgradeCost(ix, 140);
			// upCost += ns.hacknet.getCoreUpgradeCost(ix, 2);
			// upCost += ns.hacknet.getRamUpgradeCost(ix, 6);
			ns.hacknet.upgradeLevel(ix, 199);
			ns.hacknet.upgradeCore(ix, 15);
			ns.hacknet.upgradeRam(ix, 6);
			ns.toast("Node purchased and upgraded!");
			await ns.sleep(1000);
		}
	
}