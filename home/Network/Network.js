import Util from "/utils/Util.js";
import Singularity from "/utils/Singularity.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

export default class Network {

    constructor(ns) {
        this.ns = ns;
        NS = this.ns;
        this.util =  new Util(ns); //Util.getInstance(ns);
        this.singularity = new Singularity(ns);
    }

}



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
	