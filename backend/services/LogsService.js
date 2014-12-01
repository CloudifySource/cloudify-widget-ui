'use strict';

var logger = require('log4js').getLogger('LogsService');
var managers = require('../managers');

var outputBuffer = {};

/**
 * safe callback invocation
 * @private
 */
function _call() {
    // first argument is expected to be the callback, the rest are its arguments, if any
    var callback = Array.prototype.shift.call(arguments);
    callback && ('function' === typeof callback) && callback.apply({}, arguments);
}

function readFromDB(executionId, field, callback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            { _id: managers.db.toObjectId(executionId) },
            function (err, execution) {
                if (!!err) {
                    _call(callback, err);
                    done();
                    return;
                }

                _call(callback, null, execution[field]);
            }
        );
    });
}

function writeToDB(data, executionId, field, callback) {
    var update = {};
    update[field] = data;
    logger.info('Updating ' + field + ' for ' + executionId);

    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.update(
            { _id: managers.db.toObjectId(executionId) },
            { $set: update },
            function (err, nUpdated) {
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
}

function appendOutputBufferString(executionId, data) {
    if (!outputBuffer[executionId]) {
        outputBuffer[executionId] = '';
    }

    if (data) {
        outputBuffer[executionId] += data;
    }

    return outputBuffer[executionId];
}

function clearOutputBufferString(executionId) {
    delete outputBuffer[executionId];
}

exports.readOutput = function (executionId, callback) {
    readFromDB(executionId, 'output', callback);
};

exports.readStatus = function (executionId, callback) {
    readFromDB(executionId, 'status', callback);
};

exports.writeOutput = function (data, executionId, callback) {
    var buffer = appendOutputBufferString(executionId, data);
    writeToDB(buffer, executionId, 'output', callback);
};

exports.appendOutput = function (data, executionId, callback) {
    exports.writeOutput(data, executionId, callback);
};

exports.writeStatus = function (data, executionId, callback) {
    writeToDB(data, executionId, 'status', callback);
};

exports.clearOutputBuffer = function (executionId) {
    clearOutputBufferString(executionId);
};










