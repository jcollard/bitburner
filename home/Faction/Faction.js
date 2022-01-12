import Util from "/utils/Util.js";
import Augmentation from "/Faction/Augmentation.js";

export default class Faction {

    static HACK_WORK = "Hacking Contracts";
    static FIELD_WORK = "Field Work";
    static SECURITY_WORK = "Security Work";

    static get_invitations = (ns) => ns.checkFactionInvitations().map(f => new Faction(ns, f));
    static get_joined = (ns) => ns.getPlayer().factions.map(f => new Faction(ns, f));

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
