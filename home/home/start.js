/** @param {NS} ns **/
export async function main(ns) {
	ns.toast("Booting up...", "info");
	// await ns.prompt("ready?");
	ns.kill("/home/auto-server.js", "home");
	await ns.exec("/home/auto-server.js", "home");
	// ns.kill("/home/find_best_money_ratio.js", "home")
	// await ns.exec("/home/find_best_money_ratio.js", "home");
	// ns.kill("/home/auto-grow.js", "home")
	// await ns.exec("/home/auto-grow.js", "home");
	// ns.kill("/home/auto-weaken.js", "home")
	// await ns.exec("/home/auto-weaken.js", "home");
	ns.kill("/smart/deploy.js", "home");
	await ns.exec("/smart/deploy.js", "home");
	ns.kill("/home/auto_hack.js", "home");
	await ns.exec("/home/auto_hack.js", "home");
	ns.toast("Automation scripts started.", "info");
	await ns.exec("/auto/ports.js", "home");
	ns.toast("Automation Buy Ports started.", "info");
	await ns.exec("/auto/backdoor.js", "home");
	ns.toast("Automation Backdoor started.", "info");
	

}