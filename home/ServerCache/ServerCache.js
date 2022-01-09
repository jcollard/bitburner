import Util from "/utils/Util.js";
import HackUtil from "/utils/HackUtil.js";
import ServerCacheEntry from "/ServerCache/ServerCacheEntry.js";

let NS = undefined;
let DEBUG = true;
let MIN_SLEEP_TIME = 5000;

function debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

// export default function x() {};

export default class ServerCache {

    constructor(ns, money_cap) {
        NS = ns;
        this.ns = ns;
        this.cache = {};
        this.hacks = new HackUtil(ns);
        this.util = new Util(ns);
        this.next_action = 0;
        this.MIN_SLEEP_TIME = 5000;
        this.money_cap = money_cap ? money_cap : Number.POSITIVE_INFINITY;
    }

    setNextAction(time) {
        if (time > this.next_action) return;
        this.next_action = time;
    }

    /**
     * Set the money cap for all servers in this cache
     * @param {number} money_cap 
     */
    setMoneyCap(money_cap) {
        this.money_cap = money_cap;
        for(let key of Object.keys(this.cache)){
            this.cache[key].money_cap = money_cap;
        }
    }

    getServer(server) {
        if (!(server in this.cache)) {
            let entry = new ServerCacheEntry(this.ns, this, server, this.money_cap);
            this.cache[server] = entry;
        }
        return this.cache[server];
    }

    /**
     * Find a server that has RAM available to run a script.
     * @param {number} threads - The number of threads needed.
     * @param {number} ram_per_thread - The amount of ram per thread
     * @param {boolean} reverse - Optional flag to specify if the servers should be selected starting with the LEAST amount of RAM. By default, this selects servers that have the MOST RAM first.
     * @returns a ServerInfo object or undefined if no ram was available
     */
    find_available_server(threads, ram_per_thread, reverse) {
        let order = this.hacks.GetRunnables();
        if (reverse === true) order = order.reverse();
        for (let server of order) {
            let max_threads = Math.floor(this.hacks.get_available_RAM(server) / ram_per_thread);
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
