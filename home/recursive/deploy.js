import * as utils from "/utils/lib.js";

// Runs /simple/basic_hack.script on all rooted servers against themselves
/** @param {NS} ns **/
export async function main(ns) {

	let rooted = utils.find_all_hackable(ns);
	let deployScript = "/simple/basic_hack.script";
	let deployed = [];
	
	for (let server of rooted) {
		let ts = utils.calc_max_threads(ns, deployScript, server);

		// if (await ns.prompt(server + ": " + ts + " threads")) return;
		if (ts <= 0) continue;
		await ns.scp(deployScript, server);
		await ns.killall(server);
		ns.exec(deployScript, server, ts, server);
		deployed.push(server);
	}
	ns.prompt("Deployed on " + deployed.length + " server: " + deployed.join(", "));


}