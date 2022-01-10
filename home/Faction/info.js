import Util from "/utils/Util.js";
import Faction from "/Faction/Faction.js";

let ns;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);

    if (ns.args.length === 0) return display_joined_factions();
    if (Number.isInteger(ns.args[0])) return work_for_faction(Faction.get_joined(ns)[ns.args[0]]);
    
}

function display_joined_factions() {
    const joined_factions = Faction.get_joined(ns);
    let player = ns.getPlayer();
    let ix = 0;
    let format = s => s.padEnd(20);
    ns.tprintf("     %s   | %s | %s | %s | %s ", ...["Faction Name", "Augmentations", "Reputation", "Next Aug Rep", "Favor"].map(format));
    let calc_time = () => {
        return player.workRepGainRate;
    }
    for(let faction of joined_factions) {
        let num = ("" + (ix++) + ".").padEnd(4, " ");
        let name = format(faction.name);
        let working = player.currentWorkFactionName === faction.name ? "X" : " ";
        let augmentations = format(faction.get_owned_augmentations().length + " / " + faction.get_augmentations().length);
        let reputation = format(util.formatNum(faction.get_rep()) + " / " + util.formatNum(faction.get_max_rep()));
        let missing = faction.get_needed_augmentations();
        let missing_rep = missing.length > 0 ? util.formatNum(missing[0].get_rep()) : "--";
        let next_rep = format(util.formatNum(faction.get_rep()) + " / " + missing_rep );
        let favor = format("" + faction.get_favor());
        ns.tprintf("%s %s %s | %s | %s | %s | %s ", num, working, name, augmentations, reputation, next_rep, favor);
    }
}

function work_for_faction(faction) {
    faction.work(Faction.HACK_WORK, true);
}