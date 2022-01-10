
export default class Augmentation {

    constructor(ns, name, faction) {
        this.ns = ns;
        this.name = name;
        this.faction = faction;
    }

    get_rep = () => this.ns.getAugmentationCost(this.name)[0];
    get_cost = () => this.ns.getAugmentationCost(this.name)[1];
    get_prereq = () => this.ns.getAugmentationPrereq(this.name);
    get_stats = () => this.ns.getAugmentationStats(this.name);
    get_str_stats() {
        let stats = this.ns.getAugmentationStats(this.name);
        let out = [];
        for(let key of Object.keys(stats)) {
            out.push(this.ns.sprintf("%s: %s", key, stats[key]));
        }
        return out.join(", ");
    }


}