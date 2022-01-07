export default function util() { }

export const purchased_prefix = "purchased_server";
export const meta_data_file = "/meta/data.txt";

export function find_path(ns, target) {
	if (!find_all_servers(ns).includes(target)) throw new Error("Illegel target server: " + target);
	return _find_path(ns, target, "home", [], []);
}

function _find_path(ns, target, current, visited, current_path) {
	let neighbors = ns.scan(current);
	if (neighbors.includes(target)) {
		current_path.shift();
		current_path.push(current);
		current_path.push(target);
		let code = "home; connect " + current_path.join("; connect ");
		return code;
	}

	let to_visit = neighbors.filter(s => !visited.includes(s));
	let newVisited = [];
	visited.forEach(s => newVisited.push(s));
	neighbors.forEach(s => newVisited.push(s));
	let nextPath = [];
	current_path.forEach(s => nextPath.push(s));
	nextPath.push(current);

	for (let s of to_visit) {
		let result = _find_path(ns, target, s, newVisited, nextPath);
		if (result) return result;
	}

	return null;
}

export function find_all_servers(ns) {
	let servers = _find_all_servers(ns, "home", []);
	return servers;
}


export function find_all_purchased(ns) {
	return find_all_runnable(ns).filter (s => s.startsWith(purchased_prefix));
}

export function find_all_runnable(ns) {
	return _find_all_runnable(ns, "home", []).filter(s => ns.hasRootAccess(s));
}


function _find_all_runnable(ns, current, neighbors) {
	let newNeighbors = ns.scan(current)
		.filter(
			x =>
				ns.hasRootAccess(x) &&
				!x.startsWith("home") &&
				!neighbors.includes(x));
	newNeighbors.forEach(n => neighbors.push(n));
	newNeighbors.forEach(n => _find_all_servers(ns, n, neighbors));
	return neighbors;
}

function _find_all_servers(ns, current, neighbors) {
	let newNeighbors = ns.scan(current)
		.filter(
			x =>
				!x.startsWith("home") &&
				!x.startsWith(purchased_prefix) &&
				!neighbors.includes(x));
	newNeighbors.forEach(n => neighbors.push(n));
	newNeighbors.forEach(n => _find_all_servers(ns, n, neighbors));
	return neighbors;
}

export function find_all_root(ns) {
	return find_all_servers(ns).filter(s => ns.hasRootAccess(s));
}

export function find_all_hackable(ns) {
	return find_all_root(ns).filter(s => (ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()));
}

export function calc_max_threads(ns, script, server) {
	let scriptRam = ns.getScriptRam(script, server);
	let serverRam = ns.getServerMaxRam(server);
	if (serverRam == 0) return 0;
	let maxThreads = Math.floor(serverRam / scriptRam);
	return maxThreads;
}

export async function load_metadata(ns) {
	let data = (await ns.read(meta_data_file)).toString();
	return JSON.parse(data);
}

export async function write_metadata(ns, data) {
	await ns.write(meta_data_file, JSON.stringify(data), "w");
}

export function shuffle(array) {
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