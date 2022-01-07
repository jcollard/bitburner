import * as utils from "/utils/Util.js";
import * as hack_utils from "/utils/HackUtil.js";

export const hack_script = "";
export const weaken_script = "";
export const grow_script = "";

export class WGWH {
    /**
     * 
     * @param {NS} ns 
     */
    constructor(ns) {
        this.ns = ns;
        this.HackUtil = new hack_utils.HackUtil(ns);
        this.Util = new utils.Util(ns);
    }

    

    /**
     * @param {string} script 
     * @param {string} server 
     * @param {number} threads 
     * @param  {...string} args 
     */
    async exec(script, server, threads, ...args) {
        await this.ns.exec(script, server, threads, ...args);
    }

}