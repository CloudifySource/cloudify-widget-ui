'use strict';

var logger = require('log4js').getLogger('WidgetManager');
var _ = require('lodash');
var async = require('async');
var services = require('../services');
var managers = require('../managers');
var executors = require('../executors');

function _getWidget(curryParams, curryCallback) {
    logger.trace('-play- getWidget');
    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({_id: curryParams.widgetObjectId}, function (err, result) {
            if (!!err) {
                logger.error('unable to find widget', err);
                curryCallback(err, curryParams);
                done();
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                curryCallback(new Error('could not find widget'), curryParams);
                done();
                return;
            }

            curryParams.widget = result;
            curryCallback(null, curryParams);
            done();
        });
    });
}

function _getPoolKey(curryParams, curryCallback) {
    logger.info('getting user from widget');
    managers.db.connect('users', function (db, collection) {
        collection.findOne({'_id': curryParams.widget.userId}, function (err, result) {
            if (!!err) {
                logger.error('unable to find user from widget', err);
                curryCallback(err, curryParams);
                return;
            }

            if (!result) {
                logger.error('result is null for widget');
                curryCallback(new Error('could not find user for widget'), curryParams);
                return;
            }

            logger.info('found poolKey', result.poolKey);
            curryParams.poolKey = result.poolKey;
            curryCallback(null, curryParams);
        });
    });
}

function _updateExecutionModel(data, curryParams, curryCallback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            {_id: curryParams.executionObjectId},
            function (err, result) {
                if (err) {
                    logger.error('failed to retrieve execution model before update', err);
                    curryCallback(err, curryParams);
                    done();
                    return;
                }

                result = _.merge(result, data);

                collection.update(
                    {_id: curryParams.executionObjectId},
                    result,
                    function (err, nUpdated) {
                        if (err) {
                            logger.error('failed updating widget execution model', err);
                            curryCallback(err, curryParams);
                            done();
                            return;
                        }
                        if (!nUpdated) {
                            logger.error('no widget execution docs updated in the database');
                            curryCallback(new Error('no widget execution docs updated in the database'), curryParams);
                            done();
                            return;
                        }
                        curryCallback(null, curryParams);
                        done();
                    });
            });
    });
}

function updateExecution(executionObjectId, data) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.update(
            {_id: executionObjectId},
            {
                $set: data
            },
            function (err, nUpdated) {
                if (!!err) {
                    logger.error('failed updating widget execution model', err);
                    done();
                    return;
                }
                if (!nUpdated) {
                    logger.error('no widget execution docs updated in the database');
                    done();
                    return;
                }
                done();
            });
    });
}

function _getExecutionModel(curryParams, curryCallback) {

    exports.getExecutionModelById(curryParams.executionId, function (err, result) {
        if (!!err) {
            curryCallback(err, curryParams);
            return;
        }

        if (!result) {
            curryCallback(new Error('could not find execution model'), curryParams);
            return;
        }

        curryParams.executionModel = result;
        curryCallback(null, curryParams);
    });

}

function _expireNode(curryParams, curryCallback) {
    if (!curryParams.executionModel.nodeModel) {
        // nothing to expire
        curryCallback(null, curryParams);
        return;
    }

    managers.poolClient.expirePoolNode(curryParams.poolKey, curryParams.executionModel.widget.poolId, curryParams.executionModel.nodeModel.id, function (err/*, result*/) {

        if (!!err) {
            curryCallback(err, curryParams);
            return;
        }

        curryCallback(null, curryParams);
    });
}

function _updateExecutionModelStopped(curryParams, curryCallback) {
    _updateExecutionModel({
        state: 'STOPPED'
    }, curryParams, curryCallback);
}

function _stopFinally(err, curryParams) {
    logger.trace('-stop- finished !');
//    logger.info('result is ', curryParams);

    if (!!err) {
        logger.error('failed to stop widget with id [%s]', curryParams.widgetId);
        curryParams.stopCallback(err);
        return;
    }

    curryParams.stopCallback(null, {});
}

exports.getExecutionModelById = function (executionId, callback) {
    managers.db.connect('widgetExecutions', function (db, collection) {
        collection.findOne({_id: managers.db.toObjectId(executionId)}, function (err, result) {

            if (err) {
                callback(err, {});
                return;
            }

            if (!result) {
                callback(new Error('could not find execution model'), {});
                return;
            }

            callback(null, result);
        });
    });
};

var getExecutorInstance = function (type) {
    var executor;

    switch (type) {
    case 'free':
        executor = new executors.FreeWidgetExecutor();
        break;
    case 'ec2':
    case 'aws':
        executor = new executors.SoloAWSWidgetExecutor();
        break;
    case 'softlayer':
        executor = new executors.SoloSoftlayerWidgetExecutor();
        break;
    }

    return executor;
};

exports.play = function (widgetId, loginDetailsId, playCallback) {
    var executionModel = new executors.ExecutionModel(widgetId, playCallback);
    executionModel.setLoginDetailsId(loginDetailsId);

    getExecutorInstance('free').play(executionModel);
};


exports.playSolo = function (widgetId, executionDetails, playCallback) {
    logger.trace('-playRemote !!!!!!');

    var executionModel = new executors.SoloExecutionModel(widgetId, playCallback);
    executionModel.setExecutionDetails(executionDetails);

    getExecutorInstance(executionDetails.providerName).play(executionModel);
};

exports.stop = function (widgetId, executionId, isSoloMode, stopCallback) {

    var tasks = [

        function initCurryParams(callback) {
            var initialCurryParams = {
                widgetId: widgetId,
                widgetObjectId: managers.db.toObjectId(widgetId),
                executionId: executionId,
                executionObjectId: managers.db.toObjectId(executionId),
                stopCallback: stopCallback
            };
            callback(null, initialCurryParams);
        },
        _getWidget,
        _getPoolKey,
        _getExecutionModel
    ];

    // if execution is not on a remote machine, the node is in the pool - add a task to expire it
//    remote ? tasks.push(_runTeardownCommand) : tasks.push(_expireNode);
    !isSoloMode && tasks.push(_expireNode);

    tasks.push(_updateExecutionModelStopped);

    async.waterfall(
        tasks,
        _stopFinally
    );
};

function getPublicExecutionDetails(execution) {
    var retVal = {};
    retVal.widget = _.omit(execution.widget, ['userId']);

    if (execution.nodeModel) {
        retVal.nodeModel = _.merge(_.pick(execution.nodeModel, ['id']),
            {'publicIp': execution.nodeModel.machineSshDetails.publicIp},
            {'expires': execution.nodeModel.expires},
            {'state': execution.state});
    } else {
        retVal.nodeModel = {'state': execution.state};
    }

    retVal.exitStatus = execution.exitStatus;
    retVal.output = execution.output;
    if (execution.error) {
        retVal.error = execution.error;
    }

    return retVal;
}

exports.getStatus = function (executionId, callback) {
    logger.debug('getting status', callback);
    managers.db.connect('widgetExecutions', function (db, collection) {
        collection.findOne({_id: managers.db.toObjectId(executionId)}, function (err, execution) {
//            logger.debug('get status result: ', result);
            if (!!err) {
                callback(err);
                return;
            }

            if (!execution) {
                callback('execution not found', null);
                return;
            }

            // add the status from cli execution (0 or 1)..
            // if this exists on the execution status, we know execution ended.
            //

            // if expires < now, update state.
            if (execution.nodeModel && execution.nodeModel.expires < new Date().getTime()) {
                updateExecution(managers.db.toObjectId(executionId), {
                    state: 'STOPPED'
                });
            }

            logger.debug('reading status');
            services.logs.readStatus(executionId, function (err, exitStatus) {
                logger.debug('read status');
                if (!err && !!exitStatus) {
                    if (typeof( exitStatus) === 'string') {
                        exitStatus = JSON.parse(exitStatus);
                    }
                    execution.exitStatus = exitStatus;
                }
                services.logs.readOutput(executionId, function (err, output) {
                    execution.output = output;
                    logger.debug('getting public details');
                    var publicExecutionDetails = getPublicExecutionDetails(execution);
                    logger.debug('public details are', publicExecutionDetails);
                    callback(null, publicExecutionDetails);
                });
            });
        });
    });

};

exports.getOutput = function (executionId, callback) {
    services.logs.readOutput(executionId, callback);
};


exports.findById = function (widgetId, callback) {
    logger.info(widgetId);
    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({_id: managers.db.toObjectId(widgetId)}, function (err, result) {
            if (!!err) {
                logger.error('unable to find widget', err);
                done();
                callback(err);
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                done();
                callback(new Error('could not find widget'));
                return;
            }
            done();
            callback(null, result);
        });
    });
};
