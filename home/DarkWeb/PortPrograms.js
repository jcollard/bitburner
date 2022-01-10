import Util from "/utils/Util.js";

export default class PortPrograms {

    static programs = [ "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe" ];
    static INSTANCE = undefined;

	static getInstance(ns) {
		if (PortPrograms.INSTANCE === undefined) PortPrograms.INSTANCE = new PortPrograms(ns);
		return PortPrograms.INSTANCE;
	}

    constructor(ns) {
        this.ns = ns;
        this.util = new Util(ns); //.getInstance(ns);
    }

    /**
     * @returns A list of all port programs that have not been purchased
     */
    needed_programs = () => PortPrograms.programs.filter(program => !this.ns.fileExists(program))

    /**
     * @returns A list of functions to call the port opening program on a specific server
     */
    available_programs() {
        let ports = [
            this.ns.fileExists("BruteSSH.exe", "home") ? (host) => this.ns.brutessh(host) : undefined,
            this.ns.fileExists("FTPCrack.exe", "home") ? (host) => this.ns.ftpcrack(host) : undefined,
            this.ns.fileExists("relaySMTP.exe", "home") ? (host) => this.ns.relaysmtp(host) : undefined,
            this.ns.fileExists("HTTPWorm.exe", "home") ? (host) => this.ns.httpworm(host) : undefined,
            this.ns.fileExists("SQLInject.exe", "home") ? (host) => this.ns.sqlinject(host) : undefined
        ];
        return ports.filter(p => p !== undefined);
    }

    /**
     * Attempts to purchase any non-purchased port programs.
     * @returns void
     */
    purchase_all_programs() {
        // TODO: Is there a get tor price?
        if (!this.ns.getPlayer().tor && this.ns.getPlayer().money >= 200_000) {
            if(this.ns.purchaseTor()) {
                this.ns.tprintf("PortPrograms > Purchased Tor!");
            }
        }
        for (let program of this.needed_programs()) {
            // Try to purchase, if we fail, exit.
            if(!this.ns.purchaseProgram(program)) return;
            this.ns.tprintf("PortPrograms > Purchased %s", program);
        }
    }

    open_ports() {
        const programs = this.available_programs();
        // Get all servers that is not rooted that we have enough programs to open
        const targets = this.util.find_all_servers()
            .filter(s => !this.ns.getServer(s).hasAdminRights)
            .filter(s => this.ns.getServer(s).numOpenPortsRequired <= programs.length);
        
        if (targets.length === 0) return;
        this.ns.tprintf("PortPrograms > Rooting %s Servers", targets.length);
        
        for (let target of targets) {
            this.ns.tprintf("... Rooting %s", target);
            for (let program of programs) {
                program(target);
            }
            this.ns.nuke(target);
        }
    }

}