/**
 * A Utility class for Bitburner
 */
export default class Util {

	purchased_prefix = "purchased_server";
	meta_data_file = "/meta/data.txt";

	/**
	 * Constructs a Util class on the given NS interface
	 * @param {NS} ns 
	 */
	constructor(ns) {
		this.ns = ns;
	}

	/**
	 * Finds a path from home to the specified server and returns a command that can
	 * be executed to navigate to that server.
	 * @param {string} target Target Server Name
	 * @returns A string that is a command that will bring you to the specified server.
	 */
	find_path(target) {
		if (!this.find_all_servers(this.ns).includes(target)) throw new Error("Illegel target server: " + target);
		return this._find_path(this.ns, target, "home", [], []);
	}

	// Helper function for recursively finding the path
	_find_path(target, current, visited, current_path) {
		let neighbors = this.ns.scan(current);

		// If the server is one of our neighbors, we build the command and return it
		if (neighbors.includes(target)) {
			current_path.shift();
			current_path.push(current);
			current_path.push(target);
			let code = "home; connect " + current_path.join("; connect ");
			return code;
		}
	
		// Otherwise, we get a list of servers to visit
		let to_visit = neighbors.filter(s => !visited.includes(s));
		let newVisited = [];
		visited.forEach(s => newVisited.push(s));
		neighbors.forEach(s => newVisited.push(s));

		// We build up a list of the path we've taken to get here
		let nextPath = [];
		current_path.forEach(s => nextPath.push(s));
		nextPath.push(current);
	
		// Then we recursively check each neighbor
		for (let s of to_visit) {
			let result = this._find_path(target, s, newVisited, nextPath);
			if (result) return result;
		}
	 
		// If we make it this far, we can't find the target on this path
		return null;
	}

	/**
	 * 
	 * @returns A list of all servers on the network that are not owned.
	 */
	find_all_servers() {
		let servers = this._find_all_servers("home", []);
		return servers;
	}

	// Helper that recursively finds all of the servers
	_find_all_servers(current, neighbors) {
		let newNeighbors = this.ns.scan(current)
			.filter(
				x =>
					!x.startsWith("home") &&
					!x.startsWith(this.purchased_prefix) &&
					!neighbors.includes(x));
		newNeighbors.forEach(n => neighbors.push(n));
		newNeighbors.forEach(n => this._find_all_servers(n, neighbors));
		return neighbors;
	}

	/**
	 * 
	 * @returns A list of servers that we have purchased
	 */
	find_all_purchased() {
		return find_all_runnable().filter (s => s.startsWith(this.purchased_prefix));
	}

	/**
	 * 
	 * @returns A list of all non-home servers that we can run a script on
	 */
	find_all_runnable() {
		return this._find_all_runnable("home", []).filter(s => this.ns.hasRootAccess(s));
	}

	_find_all_runnable(current, neighbors) {
		let newNeighbors = this.ns.scan(current)
			.filter(
				x =>
					this.ns.hasRootAccess(x) &&
					!x.startsWith("home") &&
					!neighbors.includes(x));
		newNeighbors.forEach(n => neighbors.push(n));
		newNeighbors.forEach(n => this._find_all_servers(n, neighbors));
		return neighbors;
	}

	/**
	 * 
	 * @returns Returns a list of all servers we have root access on
	 */
	find_all_root() {
		return this.find_all_servers().filter(s => this.ns.hasRootAccess(s));
	}

	/**
	 * 
	 * @returns Returns a list of all servers that we are capable of hacking
	 */
	find_all_hackable() {
		return this.find_all_root().filter(s => (this.ns.getServerRequiredHackingLevel(s) <= this.ns.getHackingLevel()));
	}

	/**
	 * 
	 * @returns Loads and returns the meta_data JSON
	 */
	async load_metadata() {
		let data = (await this.ns.read(this.meta_data_file)).toString();
		return JSON.parse(data);
	}

	/**
	 * 
	 * @param {json} data Saves the specified data to the meta_data JSON
	 */
	async write_metadata(data) {
		await this.ns.write(this.meta_data_file, JSON.stringify(data), "w");
	}

	/**
	 * Shuffles in place the specified array
	 * @param {list} array to be shuffled
	 * @returns the array
	 */
	shuffle(array) {
		let currentIndex = array.length,  randomIndex;
	  
		// While there remain elements to shuffle...
		while (currentIndex != 0) {
	  
		  // Pick a remaining element...
		  randomIndex = Math.floor(Math.random() * currentIndex);
		  currentIndex--;
	  
		  // And swap it with the current element.
		  [array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
		}
	  
		return array;
	  }

	  /**
	   * Given a number, convert it to a millions format
	   * @param {number} num 
	   * @returns string in the millions format
	   */
	  toMillions(num) {
		  return (Math.ceil(num / 10000) / 100) + "m"; 
	  }

}