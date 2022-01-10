import Util from "/utils/Util.js";
import Faction from "/Faction/Faction.js";

let ns;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);

    if (ns.args.length === 0) return display_joined_factions();
    if (Number.isInteger(ns.args[0])) return display_faction_info(Faction.get_joined(ns)[ns.args[0]]);
    
}

function display_joined_factions() {
    const joined_factions = Faction.get_joined(ns);
    let ix = 0;
    let format = s => s.padEnd(20);
    ns.tprintf("    %s | %s | %s | %s | %s", ...["Faction Name", "Augmentations", "Reputation", "Next Aug Rep", "Favor"].map(format));
    for(let faction of joined_factions) {
        let num = ("" + (++ix) + ".").padEnd(4, " ");
        let name = format(faction.name);
        let augmentations = format(faction.get_owned_augmentations().length + " / " + faction.get_augmentations().length);
        let reputation = format(util.formatNum(faction.get_rep()) + " / " + util.formatNum(faction.get_max_rep()));
        let missing = faction.get_needed_augmentations();
        let next_rep = format(missing.length > 0 ? util.formatNum(missing[0].get_rep()) : "--");
        let favor = format("" + faction.get_favor());
        ns.tprintf("%s%s | %s | %s | %s | %s", num, name, augmentations, reputation, next_rep, favor);
    }
}

function display_faction_info(faction) {
}