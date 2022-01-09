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

    async install_backdoor(target) {
        const server = this.ns.getServer(target);
        if (!server) this.util.error("Cannot backdoor %s", target);
        if (this.ns.getServerRequiredHackingLevel(target) > this.ns.getHackingLevel()) this.util.error("Cannot backdoor %s hacking level is %s", target, this.ns.getServerRequiredHackingLevel(target));
        if (server.backdoorInstalled) this.util.exit_warning("Backdoor already installed on %s", target);
        // if (this.ns.isBusy()) this.util.exit_warning("Player is busy.");
        await this.singularity.goto(target);
        await this.ns.installBackdoor();
        await this.singularity.goto("home");
        this.ns.tprintf("Installed backdoor on %s", target);
    }

    get_backdoor_candidates() {
        // Sort such that servers will be backdoored the fastes
        let cmp = (s0, s1) => this.ns.getHackTime(s0) - this.ns.getHackTime(s1);
        return this.util.find_all_servers()
            // Don't include servers that have already been backdoored
            .filter(s => !this.ns.getServer(s).backdoorInstalled)
            // Only include servers that can be hacked
            .filter(s => this.ns.getServerRequiredHackingLevel(s) <= this.ns.getHackingLevel());
    }

    async start_next_backdoor() {
        if(this.ns.ps("home").filter(p => p.filename === "/Network/backdoor.js").length > 0) return;
        const candidates = this.get_backdoor_candidates();
        if (candidates.length === 0) return;
        const pid = await this.ns.exec("/Network/backdoor.js", "home", 1, candidates[0]);
        this.ns.tprintf("Network > Started Backdoor Process (%s) [pid %s]", candidates[0], pid);
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
	