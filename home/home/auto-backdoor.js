import execute_terminal from "/utils/run_command.js";
import * as utils from "/utils/lib.js";


/** @param {NS} ns **/
export async function main(ns) {

	while (true) {

		let hackable = utils.find_all_hackable(ns);
		let cmp = (s0, s1) => ns.getHackTime(s0) - ns.getHackTime(s1);
		hackable.sort(cmp);
		let data = await utils.load_metadata(ns);
		let toBackdoor = hackable.filter(s => !data.backdoors.includes(s)).filter(s => s !== "w0r1d_d43m0n");
		if (toBackdoor.length == 0) {
			ns.toast("No hackable servers not marked as backdoored.");
			await ns.sleep(1000 * 60);
		} else {
			let candidate = toBackdoor[0];
			ns.toast("Attempting to backdoor " + candidate, "info");
			let code = utils.find_path(ns, candidate);
			await execute_terminal(ns, "home; run /meta/addBackdoor.js " + candidate);
			await execute_terminal(ns, code + "; backdoor");	
			await ns.sleep(ns.getHackTime(candidate) + 1000);
			continue;
		}

		await ns.sleep(1000 * 60);

	}

}