import Util from "/utils/Util.js";
import Faction from "/Faction/Faction.js";

let ns;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);

    if (ns.args.length === 0) return display_available_augmentations();
    display_faction_augments(ns.args[0]);
    // if (Number.isInteger(ns.args[0])) return display_faction_info(Faction.get_joined(ns)[ns.args[0]]);
    
}

function display_faction_augments(faction_name) {
    let faction = new Faction(ns, faction_name);
    let needed = faction.get_needed_augmentations()
    let all = faction.get_augmentations();
    ns.tprintf("All: '%s'", all.map(a => a.name));
    ns.tprintf("Needed: '%s'", needed.map(a => a.name));
}

function display_available_augmentations() {
    const augmentations = Faction.get_all_available_augmentations(ns);
    let ix = 0;
    // let format = s => s.padEnd(40);
    // ns.tprintf("    %s | %s | %s | %s | %s", ...["Faction Name", "Augmentations", "Reputation", "Next Aug Rep", "Favor"].map(format));
    let name_pad, fact_pad;
    name_pad = fact_pad = 0;
    for (let aug of augmentations) {
        name_pad = Math.max(name_pad, aug.name.length);
        fact_pad = Math.max(fact_pad, aug.faction.name.length);
    }
    for(let aug of augmentations) {
        let num = ("" + (++ix) + ".").padEnd(4, " ");
        let args = [
            num,
            aug.name.padEnd(name_pad),
            aug.faction.name.padEnd(fact_pad),
            aug.get_rep() <= aug.faction.get_rep() ? "X" : " ",
            util.formatNum(aug.get_rep()),
            aug.get_str_stats()
        ]
        // args.shift(num);
        ns.tprintf("%s%s | %s | %s %s | %s", ...args);
    }
}

function display_faction_info(faction) {
}