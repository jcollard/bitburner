import Util from "/utils/Util.js";
import Network from "/Network/Network.js";


/** @param {NS} ns **/
export async function main(ns) {
    const util = new Util(ns);
    const net = new Network(ns);
    if (ns.args.length === 0) util.error("Backdoor expects a host name as the first argument.");
    ns.tprintf("Running Install Backdoor on %s", ns.args[0]);
    await net.install_backdoor(ns.args[0]);
}