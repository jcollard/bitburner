import Util from "/utils/Util.js";
import PortPrograms from "/DarkWeb/PortPrograms.js";

export default class Network {

    static INSTANCE = undefined;

	static getInstance(ns) {
		if (INSTANCE === undefined) INSTANCE = new Network(ns);
		return Util.INSTANCE;
	}

    constructor(ns) {
        this.ns = ns;
        this.ports = PortPrograms.getInstance(ns);
    }

}