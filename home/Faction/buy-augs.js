
import Util from "/utils/Util.js";
import Faction from "/Faction/Faction.js";

let ns;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);

    Faction.purchase_available_augments(ns);
}