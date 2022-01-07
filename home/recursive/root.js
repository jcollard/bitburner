import * as utils from "/utils/lib.js";
/** @param {NS} ns **/
export async function main(ns) {
	//HTTPWorm.exe   NUKE.exe       SQLInject.exe  fl1ght.exe     relaySMTP.exe
	let all = utils.find_all_servers(ns);
	let ports = {
		brute: ns.fileExists("BruteSSH.exe", "home") ? ns.brutessh : undefined,
		ftp: ns.fileExists("FTPCrack.exe", "home") ? ns.ftpcrack : undefined,
		smtp: ns.fileExists("relaySMTP.exe", "home") ? ns.relaysmtp : undefined,
		http: ns.fileExists("HTTPWorm.exe", "home") ? ns.httpworm : undefined,
		sql: ns.fileExists("SQLInject.exe", "home") ? ns.sqlinject : undefined
	}
	for (let p of Object.keys(ports)) {
		if (ports[p]) continue;
		delete ports[p];
	}
	let numPorts = Object.keys(ports).length;
	// ns.toast("Scanning for servers with " + numPorts + " or fewer ports", "info");

	// Hack anything that
	let to_hack =
		//  we don't have root access to
		all.filter(s => !ns.hasRootAccess(s))
			// We have the required hacking level to hack
			.filter(s => !ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel())
			// and we can open the correct number of ports
			.filter(s => ns.getServerNumPortsRequired(s) <= numPorts);
	if (to_hack.length === 0) {
		// ns.toast("No new servers to gain root access to.", "info");
	} else {
		to_hack.forEach(s => {
			Object.keys(ports).forEach(port => {
				ports[port](s);
			});
			ns.nuke(s);
		});
		ns.toast("Rooted " + to_hack.length + " servers");
	}

}