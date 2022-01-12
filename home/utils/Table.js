import Util from "/utils/Util.js";
export default class Table {

    constructor(ns) {
        this.ns = ns;
        this.util = new Util(ns);
        this.columns = [];
        this.width = 0;
        this.length = undefined;
    }

    /**
     * Adds a column to this table.
     * @param {string} header The header for this column
     * @param {string[]} ls The list for this column
     * @param {boolean} padStart Optional boolean specifying if we should pad the start of this column. By default this is false.
     */
    add_column(header, ls, padStart) {
        const copy = ls.filter(s => true);
        copy.unshift(header);
        let pad = this.find_pad(copy.map(a => a.toString()));
        let do_pad = s => padStart ? s.padEnd(pad) : s.padStart(pad);
        let result = copy.map(w => do_pad(w.toString()));
        if (this.length === undefined) this.length = result.length;
        this.columns.push(result);
        if (this.length !== result.length) this.util.error("Columns did not match length.");
        this.width ++;
        return result;
    }

    find_pad = ls => ls.reduce((acc, str) => Math.max(str.length, acc), 0);

    async aprint(options, delay) {
        const format = this.columns.map(s => "%s").join(" | ");
        for (let ix = 0; ix < this.width; ix++) {
            let args = this.columns.map(c => c[ix]);
            this.ns.tprintf(format, ...args);
            if (delay) await this.ns.sleep(delay);
        }
    }

    print(options) {
        const format = this.columns.map(s => "%s").join(" | ");
        for (let ix = 0; ix < this.width; ix++) {
            let args = this.columns.map(c => c[ix]);
            this.ns.tprintf(format, ...args);
        }
    }

}