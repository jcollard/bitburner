import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCacheEntry from "/ServerCache/ServerCacheEntry.js";

let NS = undefined;
let DEBUG = true;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

// export default function x() {};

export default class ServerCache {

    constructor(ns) {
        NS = ns;
        this.ns = ns;
        this.cache = {};
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
    }

    getServer(server) {
        if (!(server in this.cache)) {
            let entry = new ServerCacheEntry(this.ns, this, server);
            this.cache[server] = entry;
        }
        return this.cache[server];
    }

    /**
     * Find a server that has RAM available to run a script.
     * @param {number} threads - The number of threads needed.
     * @param {number} ram_per_thread - The amount of ram per thread
     * @returns a ServerInfo object or undefined if no ram was available
     */
    find_available_server(threads, ram_per_thread) {
        for (let server of this.hacks.GetRunnables()) {
            let max_threads = this.hacks.get_available_RAM(server) / ram_per_thread;
            if (max_threads == 0) continue;
            // If this server has some space to run 
            return new ServerInfo(server, Math.min(threads, max_threads));
        }
        return undefined;
    }

}

class ServerInfo {
    constructor(server, threads) {
        this.server = server;
        this.threads = threads;
    }
}
