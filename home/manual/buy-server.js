import Util from "/utils/Util.js";
import Network from "/Network/Network.js";
/** @param {NS} ns **/
export async function main(ns) {
    const util = new Util(ns);

    if (ns.args.length == 0) {
        ns.tprintf("Buy Server Options: ");
        let RAM = 64;
        let ix = 0;
        let max_price = ns.getPlayer().money;
        while (RAM <= ns.getPurchasedServerMaxRam()) {
            let price = ns.getPurchasedServerCost(RAM);
            ns.tprintf("%s. %s - %s", ix, util.formatNum(RAM), util.formatNum(price));
            ix++;
            RAM <<= 1;
        }
        return;
    }

    let ix = ns.args[0];
    let RAM = 64;
    while (ix-- > 0) RAM <<= 1;
    let price = ns.getPurchasedServerCost(RAM);
    let message = ns.sprintf("Buy Server with %s RAM for $%s?", util.formatNum(RAM), util.formatNum(price));
    if (ns.args[1] || await ns.prompt(message)) {
        let count = ns.getPurchasedServers().length;
        ns.purchaseServer(util.purchased_prefix + "_" + count, RAM);
        ns.toast("Purchased Server");
    }
    
}