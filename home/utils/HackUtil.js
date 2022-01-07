import Util from "/utils/Util.js";

/**
 * A Utility class for Bitburner
 */
export default class HackUtil {

    GetRunnables = () => this.util.find_all_runnable();

	/**
	 * Constructs a Util class on the given NS interface
	 * @param {NS} ns 
	 */
	constructor(ns) {
		this.ns = ns;
        this.util = new Util(ns);
	}


    /**
     * @param {...string} servers - The servers to check
     * @returns The amount of RAM that is available on the specified server
     */
    get_available_RAM(...servers) {
        let ram = (s) => this.ns.getServerMaxRam(s) - this.ns.getServerUsedRam(s);
        let sum = (a, b) => a + b;
        return servers.map(ram).reduce(sum, 0);
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
        while(this.ns.weakenAnalyze(threads++) < decreaseAmount);
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

}