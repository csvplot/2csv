#!/usr/bin/env node
// # The ``2csv-register`` command
// used by plugins to register themselves as ``2csv`` plugins

var fs = require('fs');
var path = require('path');
var commander = require('commander');

// Monkey-patch so Node 0.4.x can run this Node 0.8.x-compliant code
fs.exists = fs.exists ? fs.exists : path.exists;
fs.existsSync = fs.existsSync ? fs.existsSync : path.existsSync;

// Define the cli options and parse the input
commander
	.version('0.1.1')
	.option('-e, --extension <extension>,[extension],...', 'A comma-separated list of extensions supported by the plugin', String)
	.option('-m, --mime-type <mime>,[mime],...', 'A comma-separated list of mime types supported by the plugin', String)
	.option('-n, --name <name>', 'The name of the plugin (to use with ``require``)', String)
	.option('-r, --remove', 'Remove the indicated plugin', String)
	.parse(process.argv);

// Validate the input data (must at least include -n, and either -e or -m)
if(!commander.name) {
	throw new Error("A plugin name must be provided (-n <name>)");
}

if(!commander.extension && !commander["mime-type"] && !commander.remove) {
	throw new Error("At least one extension (-e <extension>) or mime type (-m <mime>) must be provided");
}

// Turn the extensions and mime types into an array for easier parsing
if(commander.extension) {
	commander.extension = commander.extension.split(",");
}

if(commander["mime-type"]) {
	commander["mime-type"] = commander["mime-type"].split(",");
}

// Load the current set of plugins, if any; fail out if the config file is invalid
var settings = { plugins: [] };
if(fs.existsSync(path.join(__dirname, "../2csv.json"))) { try {
	settings = JSON.parse(fs.readFileSync(path.join(__dirname, "../2csv.json")));
} catch(e) { 
	console.error(path.join(__dirname, "../2csv.json") + " is not a valid JSON file. Please correct or delete this file to use the 2csv library.");
	process.exit();
}}

// Remove the specified plugin, if any
settings.plugins = settings.plugins.filter(function(plugin) {
	return plugin.lib != commander.name;
});

if(!commander.remove) {
// Add the new plugin
	settings.plugins.push({
		lib: commander.name,
		ext: commander.extension || [],
		mime: commander["mime-type"] || []
	});
}

// Save the new settings object
fs.writeFileSync(path.join(__dirname, "../2csv.json"), JSON.stringify(settings, null, '\t'));
