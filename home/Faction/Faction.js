import Util from "/utils/Util.js";
import Augmentation from "/Faction/Augmentation.js";
import Table from "/utils/Table.js";

export default class Faction {

    static HACK_WORK = "Hacking Contracts";
    static FIELD_WORK = "Field Work";
    static SECURITY_WORK = "Security Work";

    static EARLY = [ "CyberSec", "Tian Di Hui", "Netburners" ];
    static CITY = [ "Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven" ];
    static HACKING_GROUPS = [ "NiteSec", "The Black Hand", "BitRunners" ];
    static MEGACORPS = [ "ECorp", "MegaCorp", "KuaiGong International", "Four Sigma", "NWO", "Blade Industries", "OmniTek Incorporated", "Bachman & Associates", "Clarke Incorporated", "Fulcrum Secret Technologies"];
    static CRIMINAL_ORGS = [ "Slum Snakes", "Tetrads", "Silhouette", "Speakers for the Dead", "The Dark Army", "The Syndicate" ];
    static END_GAME = [ "The Covenant", "Daedalus", "Illuminati" ];
    static ALL_FACTIONS = [
        Faction.EARLY, 
        Faction.CITY, 
        Faction.HACKING_GROUPS, 
        Faction.MEGACORPS, 
        Faction.CRIMINAL_ORGS, 
        Faction.END_GAME
    ].reduce((acc, ls) => {acc.push(...ls); return acc;}, []);

    static NAMES = {
        "early": Faction.EARLY,
        "city": Faction.CITY,
        "hacking_groups": Faction.HACKING_GROUPS,
        "megacorps": Faction.MEGACORPS,
        "criminal_orgs": Faction.CRIMINAL_ORGS,
        "end_game": Faction.END_GAME,
    };

    static get_invitations = (ns) => ns.checkFactionInvitations().map(f => new Faction(ns, f));
    static get_joined = (ns) => ns.getPlayer().factions.map(f => new Faction(ns, f));
    // static display_all_factions = (ns) => Faction.display_factions(ns, this.ALL_FACTIONS);

    static get_all_available_augmentations(ns) {
        let factions = Faction.get_invitations(ns);
        factions.push(...Faction.get_joined(ns));
        let merge = (acc, f) => {
            let contains = (aug) => acc.filter(a => a.name == aug.nam).length > 0;
            for (let aug of f.get_needed_augmentations()) {
                if (contains(aug)) continue;
                acc.push(aug);
            }
            return acc;
        }
        return factions.reduce(merge, []);
    }

    static purchase_available_augments(ns) {
        let util = new Util(ns);
        const expensive_first = (a0, a1) => a1.get_cost() - a0.get_cost();
        // TODO: Hack to buy prereq upgrads
        for (let i = 0; i < 10; i++) {
            const all_augs = Faction.get_all_available_augmentations(ns)
                // only include augmentations we can afford
                .filter(a => a.get_rep() <= a.faction.get_rep())
                .sort(expensive_first);

            for (let aug of all_augs) {
                let price = aug.get_cost();
                if (aug.purchase()) {

                    ns.tprintf("Purchased: %s for $%s", aug.name, util.formatNum(price));
                }
            }
        }
        Faction.max_neuroflux_governor(ns);
    }

    static max_neuroflux_governor(ns) {
        let best_faction = Faction.get_joined(ns).sort((f0, f1) => f1.get_rep() - f0.get_rep())[0];

        while(ns.purchaseAugmentation(best_faction.name, "NeuroFlux Governor")){
            ns.tprintf("Purchasing NeuroFlux Governor upgrade!");
        }
        ns.tprintf("Done!");

    }

    static display_factions(ns, f_names) {
        let util = new Util(ns);
        const factions = f_names.map(name => new Faction(ns, name));
        const table = new Table(ns);
        const player = ns.getPlayer();
        table.add_column("ID", factions.map((_, ix) => ix));
        table.add_column("Name", factions.map(f => f.name), true);
        table.add_column("Augmentations", factions.map(faction => faction.get_owned_augmentations().length + " / " + faction.get_augmentations().length));
        const bonus = (faction) => player.currentWorkFactionName === faction.name ? player.workRepGained : 0;
        table.add_column("Reputation", factions.map(faction => util.formatNum(bonus(faction) + faction.get_rep()) + " / " + util.formatNum(faction.get_max_rep())));
        const next_rep = faction => {
            let missing = faction.get_needed_augmentations();
            let missing_rep = missing.length > 0 ? util.formatNum(missing[0].get_rep()) : "--------";
            return util.formatNum(bonus(faction) + faction.get_rep()) + " / " + missing_rep;
        };
        table.add_column("Next Aug @", factions.map(next_rep));
        table.add_column("Favor", factions.map(f => f.get_favor()));
        table.print();
    }

    static work_for_faction = (faction) => faction.work(Faction.HACK_WORK, true);

    constructor(ns, name) {
        this.ns = ns;
        this.name = name;
    }

    donate = (amount) => this.ns.donateToFaction(this.name, amount);
    get_augmentations = () => this.ns.getAugmentationsFromFaction(this.name).map(a => new Augmentation(this.ns, a, this));
    get_favor = () => this.ns.getFactionFavor(this.name);
    get_favor_gain = () => this.ns.getFactionFavorGain(this.name);
    get_rep = () => this.ns.getFactionRep(this.name);
    get_max_rep = () => this.get_augmentations().reduce((acc, a) => Math.max(acc, a.get_rep()), 0);
    join = () => this.ns.joinFaction(this.name);
    work = (workType, focus) => this.ns.workForFaction(this.name, workType, focus);
    stopWork = () => this.ns.stopAction();

    get_needed_augmentations() {
        const cmp = (a0, a1) => a0.get_rep() - a1.get_rep();
        const owned = this.ns.getOwnedAugmentations(true);
        if (this.name.trim() === '') return [];
        const missing = this.ns.getAugmentationsFromFaction(this.name)
            .filter(s => s !== "NeuroFlux Governor")
            .filter(s => !owned.includes(s))
            .map(a => new Augmentation(this.ns, a, this))
            .sort(cmp);
        return missing;
    }

    get_owned_augmentations() {
        const augs = this.ns.getAugmentationsFromFaction(this.name);
        const owned = this.ns.getOwnedAugmentations(true)
            .filter(s => augs.includes(s))
            .map(a => new Augmentation(this.ns, a, this));
        return owned;
    }

}

let ns;
let util;

/** @param {NS} ns **/
export async function main(_ns) {
    ns = _ns;
    util = new Util(ns);
    
    if (ns.args.length === 0) {
        ns.tprintf("Showing Joined Factions. You can also use --show [" + Object.keys(Faction.NAMES).join(", ") + "]");
        return Faction.display_factions(ns, ns.getPlayer().factions);
    }

    const defaults = [
        ['show', 'journey'],
    ];

    const parsed = ns.flags(defaults);
    if (Object.keys(Faction.NAMES).includes(parsed["show"])) {
        ns.tprint(Faction.NAMES[parsed["show"]]);
        return Faction.display_factions(ns, Faction.NAMES[parsed["show"]]);
    }
    if (Number.isInteger(ns.args[0])) {
        return Faction.work_for_faction(Faction.get_joined(ns)[ns.args[0]]);
    }
    
}
