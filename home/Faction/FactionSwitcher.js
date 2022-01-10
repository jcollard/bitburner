import Faction from "/Faction/Faction.js";

export default class FactionSwitcher {

    constructor(ns) {
        this.ns = ns;
    }

    join_invited_faction() {
        let invites = Faction.get_invitations(this.ns);
        if (invites.length > 0) invites[0].join();
    }

    check_switch_faction() {
        let current_faction = new Faction(this.ns, this.ns.getPlayer().currentWorkFactionName);
        if (current_faction.get_rep() >= current_faction.get_max_rep()) {
            let sVal = f => f.get_max_rep() - f.get_rep();
            let cmp = (f0, f1) => sVal(f0) - sVal(f1);
            let joined = Faction.get_joined(this.ns)
                                // Don't join factions where you have enough rep already
                                .filter(f => sVal(f) > 0)
                                // Sort by the faction where you need the least rep to get all of the augmentations
                                .sort(cmp);
            if (joined.length === 0) return;
            let new_faction = joined[0];
            new_faction.work(Faction.HACK_WORK, true);
            this.ns.tprintf("Faction Switcher > Max Rep with %s switching work to %s", current_faction.name, new_faction.name);
        }

    }
}

export async function main(_ns) {
    let fs = new FactionSwitcher(_ns);
    while(true) {

        fs.join_invited_faction();
        fs.check_switch_faction();
        await _ns.sleep(1000);

    }
}