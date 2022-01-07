/** @param {NS} ns **/
export async function main(ns) {
	while (true) {
		await ns.exec("/recursive/root.js", "home");
		await ns.sleep(1000 * 60);
	}
}