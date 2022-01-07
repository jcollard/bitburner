/** @param {NS} ns **/
export async function main(ns) {

	for (let ix = 12; ix < 25; ix++) {
		let servername = "purchased_server_" + ix;
		// await ns.prompt("Delete server: " + servername);
		ns.killall(servername);
		ns.deleteServer(servername);
	}

}