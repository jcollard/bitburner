import Network from "/Network/Network.js";
import Util from "/utils/Util.js";

/** @param {NS} ns **/
export async function main(ns) {
    let net = new Network(ns);
    let util = new Util(ns);

    ns.tprintf("+---------------------------+");
    ns.tprintf("| Network/server-info.js    |");
    ns.tprintf("+---------------------------+");

    let server_info = net.purchase_server_info(.5);
    ns.tprintf("Next Server RAM %s - $%s", util.formatNum(server_info.RAM), util.formatNum(server_info.price));

}