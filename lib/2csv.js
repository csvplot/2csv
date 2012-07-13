// Required libraries
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var async = require('async');

// Monkey-patch for Node 0.4.x and earlier to use the Node 0.8.x API of ``fs.exists[Sync]`` instead of ``path.exists[Sync]``
fs.exists = fs.exists ? fs.exists : path.exists;
fs.existsSync = fs.existsSync ? fs.existsSync : path.existsSync;

// Load 2csv settings on application start-up
var settings = { plugins: [] };
if(fs.existsSync(path.join(__dirname, "../2csv.json"))) { try {
	settings = JSON.parse(fs.readFileSync(path.join(__dirname, "../2csv.json")));
} catch(e) { 
	console.error(path.join(__dirname, "../2csv.json") + " is not a valid JSON file. Please correct or delete this file to use the 2csv library.");
	process.exit();
}}

// The core 2csv library
module.exports = {
	plugin: null,
	load: load,
	cols: {},
	toString: toString
}

function load(data, ext, mime, next) {
	// Handle missing ext and/or mime values
	if(ext instanceof Function) {
		// Neither provided, mark undefined and make ``next`` the function
		next = ext;
		ext = undefined;
		mime = undefined;
	} else if(mime instanceof Function) {
		// One is provided, make ``next`` the function and determine if extension or MIME type provided
		next = mime;
		if(/\//.test(ext)) {
			// This is a MIME type because it has a slash
			mime = ext;
			ext = undefined;
		} else {
			// Must be an extension
			mime = undefined;
		}
	}

	// Determine if raw data was provided or a file path
	return fs.exists(data, function(exists) {
		if(exists) {
			// Determine the extension and mime value immediately
			ext = path.extname(data).replace(/\./, '');
			return childProcess.exec('file -b --mime-type "' + data + '"', function(error, stdout) {
				// Silently ignore errors; probably running on Windows
				if(error === null) {
					mime = stdout.replace(/\n/, '');
				}
				return loadFile(data, loadPlugins(ext, mime), next);
			});
		} else {
			if(ext == undefined && mime == undefined) {
				throw new Error("Cannot load raw data without either an extension or a MIME type");
			}
			loadPlugins(ext, mime);
			return loadData(data, loadPlugins(ext, mime), next);
		}
	});
}

function loadPlugins(ext, mime) {
	// Short-circuit the logic if overridden by the ``plugin`` parameter
	if(module.exports.plugin) { return require(module.exports.plugin); }
	// The list of plugins to run are those with a matching extension, followed by those with a matching MIME type,
	// where there may be one or more extensions and MIME types per plugin. Implemented with filter, some, concat, and indexOf.
	// Elegant, but probably not the fastest. Shouldn't be a bottleneck, though.
	return settings.plugins.filter(function byExt(plugin) {
		return plugin.ext.some(function testExt(theExt) {
			return theExt == ext;
		});
	}).concat(settings.plugins.filter(function byMime(plugin) {
		return plugin.mime.some(function testMime(theMime) {
			return theMime == mime;
		});
	})).filter(function unique(plugin, index, plugins) {
		return plugins.indexOf(plugin) === index;
	}).map(function initialize(plugin) {
		return require(plugin.lib);
	});
}

function loadFile(file, plugins, next) {
	// Split the provided plugins into streaming type and non-streaming
	var streamPlugins = plugins.filter(function(plugin) {
		return plugin.stream instanceof Function;
	});
	var simplePlugins = plugins.filter(function(plugin) {
		return !(plugin.stream instanceof Function);
	});
	// A variable for storing the acquired data for non-streaming plugins
	var rawData;
	// Determine if we need to use rawData or not, and define the streaming function for non-streaming plugins
	var streamHandler;
	if(simplePlugins.length > 0) {
		// Update the rawData buffer with the new chunk of data. TODO: check for one-off errors in copy code
		streamHandler = function(data) {
			var rawTemp = rawData;
			var newLen = (rawTemp && rawTemp instanceof Buffer ? rawTemp.length : 0) + (data && data instanceof Buffer ? data.length : 0);
			var dataStart = (rawTemp && rawTemp instanceof Buffer ? rawTemp.length : 0);
			if(newLen > 0) {
				rawData = new Buffer(newLen);
			}
			if(rawTemp && rawTemp instanceof Buffer) { rawTemp.copy(rawData); }
			if(data && data instanceof Buffer) { data.copy(rawData, dataStart); }
		};
	} else {
		// If we don't have any non-streaming plugins, insert a no-op function, instead
		streamHandler = function() { };
	}
	// Open the read stream for the data as a buffer; plugin must handle conversions (if needed)
	fs.createReadStream(file)
	// On each chunk of input data
	.on('data', function(data) {
		// Store the streamed data, if needed
		streamHandler(data);
		// Give the chunk to the streaming plugins
		async.forEach(streamPlugins, function(plugin, next) {
			// If the streaming plugin fails, remove it from the arrays
			try {
				plugin.stream(data);
			} catch(e) {
				streamPlugins.splice(streamPlugins.indexOf(plugin), 1);
				plugins.splice(plugins.indexOf(plugin), 1);
			} finally {
				return next();
			}
		}, function() {});
	})
	// When finished loading the file, execute non-streaming plugins, if any, and return the imported data
	.on('close', function() {
		// Load the data for the simple plugins, if any
		simplePlugins.forEach(function(plugin) {
			try {
				plugin.load(rawData);
			} catch(e) {
				simplePlugins.splice(simplePlugins.indexOf(plugin), 1);
				plugins.splice(plugins.indexOf(plugin), 1);
			}
		});
		// Determine which matched plugin to load the data from, and then return the results of that plugin
		// Extension-matched plugins take priority over MIME-matched plugins
		return async.detectSeries(plugins, function(plugin, next) {
			return next(!!plugin.data);
		}, function(plugin) {
			if(plugin) {
				module.exports.cols = plugin.data;
			} else {
				throw new Error("No plugin found to convert this file!");
			}
			return next();
		});
	})
	.on('error', function(error) {
		console.error("Error reading file: %s", error);
	});
}

// If raw data provided, give this data to each plugin, for either streaming or non-streaming plugins (preferring the non-streaming interface)
// and then return the result of the first plugin to produce an output. Extension-matched plugins take priority over MIME-matched plugins.
function loadData(data, plugins, next) {
	async.map(plugins, function(plugin, next) {
		if(plugin.load instanceof Function) {
			try {
				plugin.load(data);
			} catch(e) {
				plugins.splice(plugins.indexOf(plugin), 1);
			}
		} else {
			try {
				plugin.stream(data);
			} catch(e) {
				plugins.splice(plugins.indexOf(plugin), 1);
			}
		}
		next(plugin.data);
	}, function(err, results) {
		module.exports.cols = results.reduce(function(prevVal, currVal) {
			return prevVal || currVal;
		}, null);
		next();
	});
}

// Turn the ``cols`` object into a CSV string
function toString() {
	// If there are any results
	if(module.exports.cols instanceof Object) {
		// Get the list of columns
		var columns = Object.keys(module.exports.cols);
		// And determine how many rows exist with a map-reduce of each column's length
		var rows = columns.map(function(column) {
			return module.exports.cols[column].length;
		}).reduce(function(prevVal, currVal) {
			return prevVal > currVal ? prevVal : currVal;
		}, -1);
		// Then build a row-based data structure (versus the column-based structure returned by the plugins that's more useful
		// for direct access of a particular data value: ``cols[label][index]`` versus ``cols[firstIndex][secondIndex+1]``)
		var tempArrays = [ columns ];
		for(var i = 0; i < rows; i++) {
			var tempArray = [];
			columns.forEach(function(column) {
				tempArray.push(module.exports.cols[column][i]);
			});
			tempArrays.push(tempArray);
		}
		// Use a map-reduce on the array of arrays to create the CSV string
		return tempArrays.map(function(tempArray) {
			return tempArray.toString() + "\n";
		}).reduce(function(prevVal, currVal) {
			return prevVal + currVal;
		});
	// Otherwise return an empty string
	} else {
		return "";
	}
}
