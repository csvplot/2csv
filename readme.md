# 2csv

A [Node.js](nodejs.org)-based application for converting data into Comma-Separated Values (CSV).

## Install

    npm install -g 2csv

## Features

* Simple command-line conversion of data from supported formats (extension and/or ``file``-based determination) ``2csv file.ext //produces file.ext.csv``
* Plugin system supporting chunked or whole data.
* Registration of plugins using ``2csv-register`` command.

## Planned Features

* ``2csv-web.js`` wrapper script for using plugins in the browser in conjunction with the [File API](w3.org/TR/FileAPI)
* ``2csv-web`` command for bundling the wrapper script with specified plugins into a single .js file

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
