import Util from "/utils/Util.js";
import Singularity from "/utils/Singularity.js";

async function do_backdoor(ns, util, target) {
    ns.tprintf("Installing backdoor on %s", target);
    let singularity = new Singularity(ns);
    await singularity.goto(target);
    await ns.installBackdoor();
    await singularity.goto("home");
	await util.add_backdoor(target);
	ns.tprintf("Installed backdoor on %s", target);
}

/** @param {NS} ns **/
export async function main(ns) {
    let util = new Util(ns);

    while (true) {
        let hackable = util.find_all_hackable(ns);
        let cmp = (s0, s1) => ns.getHackTime(s0) - ns.getHackTime(s1);
        hackable.sort(cmp);
        let data = await util.get_backdoors(ns);
        let toBackdoor = hackable.filter(s => !data.backdoor.includes(s));
        if (toBackdoor.length > 0) {
            let candidate = toBackdoor[0];
            await do_backdoor(ns, util, candidate);
			continue;
        }
        await ns.sleep(1000 * 60);
    }
}
	

	// while (true) {
    //     let util = new Util(ns);
	// 	let hackable = utils.find_all_hackable(ns);
	// 	let cmp = (s0, s1) => ns.getHackTime(s0) - ns.getHackTime(s1);
	// 	hackable.sort(cmp);
	// 	let data = await utils.load_metadata(ns);
	// 	let toBackdoor = hackable.filter(s => !data.backdoors.includes(s));
	// 	if (toBackdoor.length == 0) {
	// 		await ns.sleep(1000 * 60);
	// 	} else {
	// 		let candidate = toBackdoor[0];
	// 		ns.tprintf("Auto Backdoor > Attempting to backdoor " + candidate);
	// 		let code = utils.find_path(ns, candidate);
	// 		await execute_terminal(ns, "home; run /meta/addBackdoor.js " + candidate);
	// 		await execute_terminal(ns, code + "; backdoor");	
	// 		await ns.sleep(ns.getHackTime(candidate) + 1000);
	// 		continue;
	// 	}

	// 	await ns.sleep(1000 * 60);

	// }

// }

// if (ns.args.length == 0) throw new Error("First argument should be a server name.");
// let hackable = utils.find_all_hackable(ns);
// if (!hackable.includes(ns.args[0])) throw new Error("First argument should be a hackable server.");

// let data = await utils.load_metadata(ns);
// if (data.backdoors.includes(ns.args[0])) throw new Error("Server was already marked as backdoored.");
// data.backdoors.push(ns.args[0]);

// await utils.write_metadata(ns, data);

// ns.toast("Backdoor marked.");