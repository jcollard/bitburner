import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	await deploy_all(ns);
}

export async function deploy_all(ns) {
	let deployScript = "/purchased/basic.js";
	let rooted = utils.find_all_hackable(ns).join(",");
	let index = 0;
	let candiate_name = utils.purchased_prefix + "_" + index;
	while (ns.serverExists(candiate_name)) {
		await deploy(ns, candiate_name, deployScript, rooted);
		ns.toast("Deployed " + candiate_name, "info");
		await ns.sleep(1000);
		index++;
		candiate_name = utils.purchased_prefix + "_" + index;
	}
}

export async function deploy(ns, server, deployScript, rooted) {
	await ns.scp(deployScript, server);
	let scriptRam = ns.getScriptRam(deployScript, server);
	let serverRam = ns.getServerMaxRam(server);
	let maxThreads = Math.floor(serverRam / scriptRam);
	await ns.killall(server);
	ns.exec(deployScript, server, maxThreads, rooted);
}