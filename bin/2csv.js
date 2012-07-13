#!/usr/bin/env node
// # The ``2csv`` command-line utility

var fs = require('fs');
var commander = require('commander');
var toCsv = require('2csv');

process.on('uncaughtException', function (err) {
	  console.error('Could not convert file: %s', err);
	  process.exit(-1);
});

commander
	.version('0.1.1')
	.usage('[options] <inputfile>')
	.option('-i, --input <file>', 'The input file to convert', String)
	.option('-o, --output [file]', 'The output filename (optional)', String)
	.option('-c, --converter [name]', 'The specific 2csv converter plugin to use (optional)', String)
	.parse(process.argv);

if(commander.converter) {
	toCsv.plugin = commander.converter;
}

if(!commander.input) {
	commander.input = process.argv[process.argv.length-1];
}

if(!commander.output) {
	commander.output = commander.input + ".csv";
}

toCsv.load(commander.input, function() {
	fs.writeFileSync(commander.output, toCsv.toString());
});
