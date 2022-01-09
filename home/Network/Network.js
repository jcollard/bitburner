import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
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
        this.util = new Util(ns); //Util.getInstance(ns);
        this.hacks = new HackUtil(ns)
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
        if (this.ns.ps("home").filter(p => p.filename === "/Network/backdoor.js").length > 0) return;
        const candidates = this.get_backdoor_candidates();
        if (candidates.length === 0) return;
        const pid = await this.ns.exec("/Network/backdoor.js", "home", 1, candidates[0]);
        this.ns.tprintf("Network > Started Backdoor Process (%s) [pid %s]", candidates[0], pid);
    }

    purchase_server(growthAmount) {
        let server_info = this.purchase_server_info(growthAmount);
        let count = this.ns.getPurchasedServers().length;
        if (this.ns.getPlayer().money >= server_info.price) {
            this.ns.tprintf("Network > Purchasing new server with %s GB RAM for $%s", this.util.formatNum(server_info.RAM), this.util.formatNum(server_info.price)); 
			let purchased = this.ns.purchaseServer(this.util.purchased_prefix + "_" + count, server_info.RAM);
			if (purchased) this.ns.toast("... Purchased new server: " + purchased);
        }
    }

    purchase_server_info(growthAmount) {
        const network_ram = this.hacks.get_max_RAM(...this.hacks.GetRunnables());
        const desired_ram = network_ram * growthAmount;
        let target_RAM = 2;
        while (target_RAM < desired_ram) target_RAM <<= 1;
        target_RAM = Math.min(target_RAM, this.ns.getPurchasedServerMaxRam());
        const price = this.ns.getPurchasedServerCost(target_RAM);
        return { RAM: target_RAM, price: price};
    }

}
