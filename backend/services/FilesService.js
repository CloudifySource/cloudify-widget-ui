'use strict';
var logger = require('log4js').getLogger('FilesService');
var fs = require('fs');
var path = require('path');

exports.mkdirp = function (directory) {
    var outputDirPathItems = directory.split(path.sep);
    if (outputDirPathItems.length > 0 && directory.indexOf('/') === 0) {
        outputDirPathItems[0] = '/' + outputDirPathItems[0];
    }
    var item = '';
    for (var i = 0; i < outputDirPathItems.length; i++) {
        item = path.join(item, outputDirPathItems[i]);
        if (!fs.existsSync(item)) {
            logger.info('creating :: ' + item);
            fs.mkdirSync(item);
        }
    }
};



/**
 * walks a directory tree and returns file paths as an unordered list.
 * when order of results is not important, this is much faster than serial walk.
 * @see http://stackoverflow.com/a/5827895/547020
 * @see walkSerial
 */
function walkParallel (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) {
            return done(err);
        }
        var pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walkParallel(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) {
                            done(null, results);
                        }
                    });
                } else {
                    results.push(file);
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
}

/**
 * walks a directory tree and returns file paths as an ordered list. slower than parallel walk.
 * @see http://stackoverflow.com/a/5827895/547020
 */
function walkSerial (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) {
            return done(err);
        }
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file){
                return done(null, results);
            }
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walkSerial(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
}

/**
 * walks a directory tree and returns file paths as a list.
 * when order of results is important, pass {@code true} to serial,
 * but note that this is much slower than parallel walk.
 *
 * @param dir the directory path
 * @param done a callback with err and result as parameters
 * @param serial (Boolean) a serial walk means ordered results, but it's much slower. default is parallel.
 *
 * @see walkSerial
 * @see walkParallel
 */
exports.walk = function (dir, done, serial) {
    if (serial) {
        return walkSerial(dir, done);
    } else {
        return walkParallel(dir, done);
    }
};