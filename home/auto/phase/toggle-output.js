import * as Files from "/utils/Files.js";

/** @param {NS} ns **/
export async function main(ns) {
    if (!ns.fileExists(Files.SILENT_FILE)) await ns.write(Files.SILENT_FILE, JSON.stringify(false));
    let data = JSON.parse(ns.read(Files.SILENT_FILE));
    ns.tprintf("Silent: %s", !data);
    await ns.write(Files.SILENT_FILE, JSON.stringify(!data), 'w');
}