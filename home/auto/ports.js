

/** @param {NS} ns **/
export async function main(ns) {

	let ports = () => {
		return {
			brute: ns.fileExists("BruteSSH.exe", "home") ? false : "BruteSSH.exe",
			ftp: ns.fileExists("FTPCrack.exe", "home") ? false : "FTPCrack.exe",
			smtp: ns.fileExists("relaySMTP.exe", "home") ? false : "relaySMTP.exe",
			http: ns.fileExists("HTTPWorm.exe", "home") ? false : "HTTPWorm.exe",
			sql: ns.fileExists("SQLInject.exe", "home") ? false : "SQLInject.exe"
		};
	}

	let check_ports = () => {
		let count = Object.keys(ports()).filter(p => ports()[p] === false).length;
		return count >= 5;
	};

	while (true) {
		// ns.prompt("Count: " + check_ports());
		if (check_ports()) {
			ns.toast("All port openers available. Exiting auto-buy-ports.");
			ns.exit();
			return;
		}

		ns.toast("Attempting to purchase port openers.", "info");
		for (let port of Object.keys(ports()).filter(p => ports()[p] !== false)) {
			let program = ports()[port];
			if (await ns.purchaseProgram(program)) {
				ns.tprintf("Purchased: %s", program)
			} 
		}

		await ns.sleep(1000 * 60);
	}

}