function shuffle(array) {
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


/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) throw new Error("Purchased Basic Script should take in a single argument that is a comma seperated list of servers to hack.");

	let neighbors = ns.args[0].split(",");

	while (true) {
		let finished = true;
		shuffle(neighbors);
		for (let ix = 0; ix < neighbors.length; ix++) {
			let neighbor = neighbors[ix];
			let level = ns.getServerSecurityLevel(neighbor);
			let min = ns.getServerMinSecurityLevel(neighbor);
			if (level <= min * 1.25) continue;
			finished = false;
			await ns.weaken(neighbor);
		}

		if (!finished) continue;

		for (let ix = 0; ix < neighbors.length; ix++) {
			let neighbor = neighbors[ix];
			let max = ns.getServerMaxMoney(neighbor);
			let money = ns.getServerMoneyAvailable(neighbor);
			if (money <= max * .75) await ns.grow(neighbor);
			else await ns.hack(neighbor);
		}

	}

}