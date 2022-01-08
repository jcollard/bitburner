import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCache from "/ServerCache/ServerCache.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

export default class WGWH {
    /**
     * 
     * @param {NS} ns 
     */
    constructor(ns) {
        NS = ns;
        this.ns = ns;
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
        this.schedule = [];
        this.server_cache = new ServerCache(ns);
        this.tick_speed = 1000;
    }

    async run() {
        while (true) {
            await this.tick();
            await this.ns.sleep(this.tick_speed);
        }
    }

    async tick() {
        debug("Entering Tick");
        let workers = this.hacks.GetRunnables();
        // If there is no RAM available, we cannot do any work so we just return.
        if (this.hacks.get_available_RAM(...workers) < this.hacks.HACK_RAM()) {
            debug("No RAM available. Skipping Tick.");
            return;
        }

        let to_hack = this.hacks.GetHackables();
        debug("Processing %s Hackable Servers...", to_hack.length);
        // Process each server that can be hacked
        for (let target of to_hack) {
            let entry = this.server_cache.getServer(target);
            entry.tick();
        }
        debug("Exiting Tick");
    }

}