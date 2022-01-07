export default async function execute_terminal(ns, command) {
	const terminalInput = document.getElementById("terminal-input");
	// await ns.prompt(terminalInput);
	if (!terminalInput) {
		ns.toast("Could not find terminal input.", "warning");
		await ns.sleep(1000 * 10);
		return;
	}

	// Set the value to the command you want to run.
	terminalInput.value = command;

	// Get a reference to the React event handler.
	const handler = Object.keys(terminalInput)[1];

	// Perform an onChange event to set some internal values.
	terminalInput[handler].onChange({ target: terminalInput });

	// Simulate an enter press
	terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null });
	await ns.sleep(1000);
}