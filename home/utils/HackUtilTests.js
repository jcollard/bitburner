import HackUtil from "/utils/HackUtil.js";



/** @param {NS} ns **/
export async function main(ns) {
    let hacks = new HackUtil(ns);
    // await ns.alert("Runnables: " + HackUtil.GetRunnables());
    // await ns.alert("Meh")
    let TotalRAM = hacks.get_available_RAM(...hacks.GetRunnables());
    await ns.alert("Total Ram: " + TotalRAM + " GB");
    // await ns.alert("Test");
}