import * as utils from "/utils/lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	let hackable = utils.find_all_hackable(ns);
	let data = await utils.load_metadata(ns);
	let toBackdoor = hackable.filter(s => !data.backdoors.includes(s));
	if (toBackdoor.length == 0) {
		ns.toast("No hackable servers not marked as backdoored.");
	} else {
		ns.prompt("Not marked as backdoored: " + toBackdoor.join(", "));
	}
}