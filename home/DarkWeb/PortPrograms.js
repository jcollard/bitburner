
export default class PortPrograms {

    static programs = [ "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe" ];
    static INSTANCE = undefined;

	static getInstance(ns) {
		if (INSTANCE === undefined) INSTANCE = new PortOpeners(ns);
		return Util.INSTANCE;
	}

    constructor(ns) {
        this.ns = ns;
    }

    /**
     * @returns A list of all port programs that have not been purchased
     */
    needed_programs = () => PortPrograms.filter(program => !this.ns.fileExists(program))

    /**
     * @returns A list of functions to call the port opening program on a specific server
     */
    available_programs() {
        let ports = [
            ns.fileExists("BruteSSH.exe", "home") ? ns.brutessh : undefined,
            ns.fileExists("FTPCrack.exe", "home") ? ns.ftpcrack : undefined,
            ns.fileExists("relaySMTP.exe", "home") ? ns.relaysmtp : undefined,
            ns.fileExists("HTTPWorm.exe", "home") ? ns.httpworm : undefined,
            ns.fileExists("SQLInject.exe", "home") ? ns.sqlinject : undefined
        ];
        return ports.filter(p => p !== undefined);
    }

    /**
     * Attempts to purchase any non-purchased port programs.
     * @returns void
     */
    purchase_all_programs() {
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
            this.ns.tprintf("PortPrograms > Rooting %s", target);
            for (let program of programs) {
                program(target);
            }
        }
    }

}