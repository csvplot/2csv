[![build status](https://secure.travis-ci.org/csvplot/2csv.png)](http://travis-ci.org/csvplot/2csv)
# 2csv

A [Node.js](nodejs.org)-based application for converting data into Comma-Separated Values (CSV).

## Install

    npm install -g 2csv

## Usage

    Usage: 2csv [options] <inputfile>
    
    Options:
    
      -h, --help              output usage information
      -V, --version           output the version number
      -i, --input <file>      The input file to convert
      -o, --output [file]     The output filename (optional)
      -c, --converter [name]  The specific 2csv converter plugin to use (optional)

After installing ``2csv``, you must install one or more converter plugins (2csv comes with none). You can find a [list of 2csv plugins here](https://github.com/csvplot/2csv/wiki/List-of-2csv-plugins).

## Features

* Simple command-line conversion of data from supported formats (extension and/or ``file``-based determination) ``2csv file.ext //produces file.ext.csv``
* Plugin system supporting chunked or whole data.
* Registration of plugins using ``2csv-register`` command.

## Planned Features

* ``2csv-web.js`` wrapper script for using plugins in the browser in conjunction with the [File API](w3.org/TR/FileAPI)
* ``2csv-web`` command for bundling the wrapper script with specified plugins into a single .js file

## ``2csv`` as a library

You can also use ``2csv`` as a library for loading data from supported formats (based on what plugins you have installed) inside of your own Node.js applications.

```js
var toCsv = require('2csv');

// Optionally force the plugin to convert your data
toCsv.plugin = "tlp2csv"; // The string must match what you'd insert into ``require``

// Load the file or raw data, providing a callback to execute when done
toCsv.load("filenameOrRawData", function() {
	var dataStructure = toCsv.cols; // An object whose keys are the names of the columns and the values are arrays containing each column's data
	var csvString = toCsv.toString(); // A string containing the CSV file (complete with \n's for each line end)
});
```

## Plugin Authors

Writing a ``2csv`` compatible plugin is simple. Define an object like this:

```js
myPlugin = {
    data: null,
    load: myLoadFunction,
    stream: myStreamFunction
};
```

You only have to define either ``load`` or ``stream`` (you can define both, but that's not necessary).

``load`` is a function that takes a ``Buffer`` object of the entire file to be converted and writes its output into the ``data`` property.

The ``data`` property must be structured like this:

```js
{
    col1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    col2: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    col3: ['metadata text']
}
```

Simply, each column is given a label, and the number of rows for the column can be independent from each other. The library will generate the CSV correctly, with the column names as the first line.

If you write a ``stream`` function instead, the function will be called an unknown number of times (possibly only once) with a ``Buffer`` object on each call. It must also generate a valid ``data`` structure by the end of the loading.

After defining your plugin object, write a line like this:

```js
if(module && module.exports) { module.exports = myPlugin; }
```

So you can use your plugin both in the browser and from the command line.

It must be possible to ``require`` the plugin for the ``2csv`` command to use it, and it must be "registered" for the ``2csv`` and ``2csv-web`` commands. This is accomplished with ``2csv-register`` command.

    Usage: 2csv-register [options]
    
    Options:
    
      -h, --help                                   output usage information
      -V, --version                                output the version number
      -e, --extension <extension>,[extension],...  A comma-separated list of extensions supported by the plugin
      -m, --mime-type <mime>,[mime],...            A comma-separated list of mime types supported by the plugin
      -n, --name <name>                            The name of the plugin (to use with ``require``)
      -r, --remove                                 Remove the indicated plugin

This can be done automatically on install/uninstall inside of the npm ``package.json`` file. An example of how this is done can be seen with the [tlp2csv plugin](http://github.com/csvplot/tlp2csv).

## License (MIT)

Copyright (C) 2011 by David Ellis.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
