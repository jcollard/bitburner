import Util from "/utils/Util.js";
import Augmentation from "/Faction/Augmentation.js";

export default class Faction {

    static get_invitations = (ns) => ns.checkFactionInvitations().map(f => new Faction(ns, f));
    static get_joined = (ns) => ns.getPlayer().factions.map(f => new Faction(ns, f));
    
    static get_all_available_augmentations (ns) {
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

    get_needed_augmentations () {
        const cmp = (a0, a1) => a0.get_rep() - a1.get_rep();
        const owned = this.ns.getOwnedAugmentations(true);
        const missing = this.ns.getAugmentationsFromFaction(this.name)
                             .filter(s => !owned.includes(s))
                             .map(a => new Augmentation(this.ns, a, this))
                             .sort(cmp);
        return missing;
    }

    get_owned_augmentations () {
        const augs = this.ns.getAugmentationsFromFaction(this.name);
        const owned = this.ns.getOwnedAugmentations(true)
                             .filter(s => augs.includes(s))
                             .map(a => new Augmentation(this.ns, a, this));
        return owned;
    }

}
