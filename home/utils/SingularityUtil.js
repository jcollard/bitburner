import Util from "/utils/Util.js";

/**
 * A Utility class for Bitburner
 */
export default class SingularityUtil {

    constructor(ns) {
        this.ns = ns;
        this.util = new Util(ns);
    }

    async goto(target) {
        this.ns.tprintf("Connecting to %s", target);
        let path = this.util.find_path(target, this.ns.getCurrentServer());

        ns.tprintf("Path: %s", path.join("> "))

        while (path.length > 0) {
            let next = path.shift();
            this.ns.connect(next);
        }
    }

}