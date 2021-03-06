import Util from "/utils/Util.js";

const HACK_SCRIPT = "/simple/hack.js"; // 1.75 GB
const WEAKEN_SCRIPT = "/simple/weaken.js"; // 1.75 GB
const GROW_SCRIPT = "/simple/grow.js"; // 1.75 GB

let NS = undefined;
let DEBUG = true;

function _debug(str, ...args) {
    if (!DEBUG) return;
    NS.tprintf(str, ...args);
}

let sum = (a, b) => a + b;

// Compare function which returns the highest money / time ratio.
function MoneyTimeRatio(ns) {
    const ratio = (server) => {
		let time = ns.getHackTime(server);
		let amountPerThread = ns.getServerMoneyAvailable(server) * ns.hackAnalyze(server);
		let chance = ns.hackAnalyzeChance(server);
		let value = (amountPerThread * chance) / time;
		return value;
	};
    return (s0, s1) => -(ratio(s0) - ratio(s1));
}

/**
 * A Utility class for Bitburner
 */
export default class HackUtil {
    

    static HACK_SCRIPT = HACK_SCRIPT; // 1.75 GB
    static WEAKEN_SCRIPT = WEAKEN_SCRIPT; // 1.75 GB
    static GROW_SCRIPT = GROW_SCRIPT; // 1.75 GB
    static INSTANCE = undefined;

	static getInstance(ns) {
		if (HackUtil.INSTANCE === undefined) HackUtil.INSTANCE = new HackUtil(ns);
		return HackUtil.INSTANCE;
	}

    // Compare function for sorting Runnable Servers by max available ram
    _MostRAM = (s0, s1) => -(this.get_available_RAM(s0) - this.get_available_RAM(s1));
    GetRunnables = () => this.util.find_all_runnable().sort(this._MostRAM);
    GetHackables = () => this.util.find_all_hackable().sort(MoneyTimeRatio(this.ns));
    HACK_RAM = () => this.ns.getScriptRam(HACK_SCRIPT);
    WEAKEN_RAM = () => this.ns.getScriptRam(WEAKEN_SCRIPT);
    GROW_RAM = () => this.ns.getScriptRam(GROW_SCRIPT);

	/**
	 * Constructs a Util class on the given NS interface
	 * @param {NS} ns 
	 */
	constructor(ns) {
        NS = ns;
		this.ns = ns;
        this.util = new Util(ns);
	}

    /**
     * @param  {...any} servers - The servers to check
     * @returns The amount of max RAM among the specified servers
     */
    get_max_RAM(...servers) {
        if (servers.length === 0) return 0;
        return servers.map(s => this.ns.getServerMaxRam(s)).reduce(sum);
    }

    /**
     * @param {...string} servers - The servers to check
     * @returns The amount of RAM that is available on the specified server
     */
    get_available_RAM(...servers) {
        if (servers.length === 0) return 0;
        let ram = (s) => { 
            let available = this.ns.getServerMaxRam(s) - this.ns.getServerUsedRam(s);
            if (available < this.HACK_RAM()) return 0;
            return available;
        }
        return servers.map(ram).reduce(sum);
    }

    get_available_threads = (...servers)  => servers.map(s => Math.floor(this.get_available_RAM(s) / this.HACK_RAM())).reduce(sum, 0);
    get_max_threads = (...servers) => servers.map(s => Math.floor(this.get_max_RAM(s) / this.HACK_RAM())).reduce(sum, 0);
    

    get_weaken_threads = (target) => this.get_threads(target, HackUtil.WEAKEN_SCRIPT);
    get_grow_threads = (target) => this.get_threads(target, HackUtil.GROW_SCRIPT);
    get_hack_threads = (target) => this.get_threads(target, HackUtil.HACK_SCRIPT);

    get_threads(target, script) {
        let processes = [];
        for (let server of this.GetRunnables()) {
            let ps = this.ns.ps(server).filter(p => p.filename === script && p.args[0] === target);
            processes.push(...ps);
        }
        return processes.map(p => p.threads).reduce(sum, 0);
    }

    /**
	 * Calculates the maximum number of threads a specific script can be run on
     * the specified server
	 * @param {string} script the script (on that server)
	 * @param {string} server the hostname
	 * @returns The number of threads that can be run on the specified server
	 */
	calc_max_threads(script, server) {
		let scriptRam = this.ns.getScriptRam(script, server);
		let serverRam = this.ns.getServerMaxRam(server);
		if (serverRam == 0) return 0;
		let maxThreads = Math.floor(serverRam / scriptRam);
		return maxThreads;
	}

    /**
     * Given the desired decrease, return the number of threads necessary to
     * decrease security on a regular server.
     * @param {number} decreaseAmount 
     * @returns The number of threads to remove the specified security
     */
    calc_threads_to_weaken(decreaseAmount) {
        let threads = 0;
        while(this.ns.weakenAnalyze(++threads) < decreaseAmount);
        return threads;
    }

    /**
     * 
     * @param {string} server The host to remove security from
     * @returns Number of threads necessary to remove the maximum amount of security
     */
    calc_weaken_threads_needed(server) {
        let currSec = this.ns.getServerSecurityLevel(server);
        let minSec = this.ns.getServerMinSecurityLevel(server);
        let targetDecrease = currSec - minSec;
    
        if (currSec > minSec) {
            let threads = 1;
            // let decrease = ns.weakenAnalyze(threads);
            while (this.ns.weakenAnalyze(threads++) < targetDecrease);
            return threads;
        }
        return 0;
    }

    /**
     * 
     * @param {string} server 
     */
    calc_grow_threads_needed(server) {
        let debug = (str, ...args) => undefined;
        // let debug = (str, ...args) => _debug(str, ...args);
        debug("HackUtil.calc_grow_threads_needed(%s)", server);
        let growthPercent = this.calc_max_growth(server);
        debug("... growthPercent: %s", growthPercent);
        if (growthPercent === undefined) return 0;
        // TODO: Need to choose a reasonable number here rather than just 1000
        if (growthPercent === -1) return 1000;
        let threads = Math.ceil(this.ns.growthAnalyze(server, growthPercent));
        debug("... threads: %s", threads);
        return threads;
    }

    /**
     * Calculates the maximum growth %.
     * Returns -1 if the server has 0 money available. Returns undefined if the server's max money is 0.
     * @param {string} server - Target server
     * @returns The maximum growth %
     */
    calc_max_growth(server) {
        if (this.ns.getServerMaxMoney(server) == 0) return undefined;
        if (this.ns.getServerMoneyAvailable(server) == 0) return -1;
        return this.ns.getServerMaxMoney(server) / this.ns.getServerMoneyAvailable(server);
    }

    calc_hack_threads(server, percent) {
        let target_amount = this.ns.getServerMoneyAvailable(server) * percent;
        return Math.ceil(this.ns.hackAnalyzeThreads(server, target_amount));
    }

}