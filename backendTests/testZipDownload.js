
var logger = require('log4js').getLogger('TestZip');
var fs = require('fs');
var path = require('path');
var download = require('download');

var src = 'https://dl.dropbox.com/u/5682483/mongodb.zip';
var dest = 'extracted';


// download and extract `foo.tar.gz` into `bar/`
var dl = download(src, dest, { extract: true });


dl.on('error', function (e) {
    logger.error(e);
});

dl.on('close', function () {
    logger.info('- - - - - - - - ', fs.existsSync(path.join(dest, 'mongodb')));
});
