import Faction from "/Faction/Faction.js";

export default class FactionSwitcher {

    constructor(ns) {
        this.ns = ns;
    }

    join_invited_faction() {

        let city_factions = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];
        let ignore = f_name => {
            // If there is no restriction, go ahead and join it
            if (!city_factions.includes(f_name)) return true;
            // If this faction will restrict you from joining another faction, only join if you still need augments from them
            return f.get_needed_augmentations().length > 0;
        };
        let invites = Faction.get_invitations(this.ns)
            .filter(ignore);
        if (invites.length > 0) {

            invites[0].join();
        }
    }

    check_switch_faction() {
        let player = this.ns.getPlayer();
        let current_faction = new Faction(this.ns, player.currentWorkFactionName);
        let current_rep = current_faction.name !== '' ? current_faction.get_rep() + player.workRepGained : 0;
        let max_rep = current_faction.name !== '' ? current_faction.get_max_rep() : -1;
        // this.ns.tprintf("%s", current_rep);
        // if (current_faction.name !== '') this.ns.tprintf("Current Rate: %s %s",player.workRepGainRate, player.faction_rep_mult);

        if (current_faction.get_needed_augmentations().length == 0 || current_rep >= max_rep) {
            if (current_faction.name !== '') current_faction.stopWork();
            let sVal = f => f.get_max_rep() - f.get_rep();
            let cmp = (f0, f1) => sVal(f0) - sVal(f1);
            let joined = Faction.get_joined(this.ns)
                .filter(f => f.get_needed_augmentations().length > 0)
                // Don't join factions where you have enough rep already
                .filter(f => sVal(f) > 0)
                // Sort by the faction where you need the least rep to get all of the augmentations
                .sort(cmp);
            if (joined.length === 0) return;
            let new_faction = joined[0];
            // TODO: Make focus based on if you own the augment that doesn't require focus.
            let focus = false;
            new_faction.work(Faction.HACK_WORK, focus);
            this.ns.tprintf("Faction Switcher > Max Rep with %s switching work to %s", current_faction.name, new_faction.name);
        }
    }
}

export async function main(_ns) {
    let fs = new FactionSwitcher(_ns);
    while (true) {

        fs.join_invited_faction();
        fs.check_switch_faction();
        await _ns.sleep(1000);

    }
}