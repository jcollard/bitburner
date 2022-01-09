import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	utils.find_all_runnable(ns).forEach(s => {
		ns.killall(s);
	});
}