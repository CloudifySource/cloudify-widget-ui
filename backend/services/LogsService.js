'use strict';

var logger = require('log4js').getLogger('LogsService');

var fs = require('fs-extra');
var path = require('path');
var conf = require('../Conf');
var files = require('../services/FilesService');
var managers = require('../managers');

/**
 * safe callback invocation
 * @private
 */
function _call() {
    // first argument is expected to be the callback, the rest are its arguments, if any
    var callback = Array.prototype.shift.call(arguments);
    callback && ('function' === typeof callback) && callback.apply({}, arguments);
}

function _getLogDirPath(relativePath) {
    return path.join(conf.logsDir, relativePath || '');
}

function _getLogFilePath(relativePath, fileName) {
    return path.join(_getLogDirPath(relativePath), fileName);
}

function _getOutputFilePath(relativePath) {
    return _getLogFilePath(relativePath, 'output.log');
}

function _getStatusFilePath(relativePath) {
    return _getLogFilePath(relativePath, 'status.log');
}

function _readLog(logFilePath, callback) {

    if (!logFilePath) {
        _call(callback, new Error('unable to get output, cannot build log file path'));
        return;
    }

    fs.exists(logFilePath, function (exists) {

        if (!exists) {
            _call(callback, new Error('file does not exist'));
            return;
        }

        fs.readFile(logFilePath, 'utf8', function (err, data) {
            if (!!err) {
                _call(callback, err);
                return;
            }
            _call(callback, null, data);
        });
    });
}

function _writeLog(data, logsDir, logFilePath, callback) {
    files.mkdirp(logsDir); // make sure dir exists
    fs.writeFile(logFilePath, data, function (err) {
        if (!!err) {
            logger.error('unable to write to log file', logFilePath, data.toString(), err);
            _call(callback, err);
            return;
        }
        _call(callback);
    });
}

function _appendToDB(data, executionId, field, callback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            { _id: managers.db.toObjectId(executionId) },
            function (err, execution) {
                if (!!err) {
                    _call(callback, err);
                    done();
                    return;
                }

                var update = {};

                if (!execution[field]) {
                    update[field] = data;
                } else {
                    update[field] = execution[field] + data;
                }

                collection.update(
                    { _id: managers.db.toObjectId(executionId) },
                    { $set: update },
                    function(err, nUpdated) {
                        if (!!err) {
                            _call(callback, err);
                            done();
                            return;
                        }
                        if (!nUpdated) {
                            _call(callback, new Error('no widget execution docs updated in the database'));
                            done();
                            return;
                        }
                        _call(callback);
                        done();
                    }
                );

            });
    });
}

function _appendLog(data, logsDir, logFilePath, callback) {
    files.mkdirp(logsDir); // make sure dir exists
    fs.appendFile(logFilePath, data, function (err) {
        if (!!err) {
            logger.error('unable to append to log file', logFilePath, data.toString(), err);
            _call(callback, err);
            return;
        }
        _call(callback);
    });
}

exports.readOutput = function (relativePath, callback) {

    var logFilePath = _getOutputFilePath(relativePath);
//    logger.info('file, reading from :: ', path.resolve(logFilePath));
    _readLog(logFilePath, callback);
};

exports.readStatus = function (relativePath, callback) {
    _readLog(_getStatusFilePath(relativePath), callback);
};

exports.writeOutput = function (data, relativePath, callback) {
    _writeLog(data, _getLogDirPath(relativePath), _getOutputFilePath(relativePath), callback);
//    _appendToDB(data, relativePath, 'output', callback);
};

exports.appendOutput = function (data, relativePath, callback) {
    _appendLog(data, _getLogDirPath(relativePath), _getOutputFilePath(relativePath), callback);
//    _appendToDB(data, relativePath, 'output', callback);
};

exports.writeStatus = function (data, relativePath, callback) {
    _writeLog(data, _getLogDirPath(relativePath), _getStatusFilePath(relativePath), callback);
//    _appendToDB(data, relativePath, 'status', callback);
};











