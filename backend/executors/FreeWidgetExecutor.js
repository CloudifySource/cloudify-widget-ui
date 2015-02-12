/**
 * Created by sefi on 22/01/15.
 */
'use strict';

var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('FreeWidgetExecutor');
var managers = require('../managers');
var services = require('../services');
var path = require('path');
var util = require('util');
var models = require('../models');

function FreeWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(FreeWidgetExecutor, AbstractWidgetExecutor);

//-----------  Private tasks  ----------------------
/**
 * Retrieve the pool key from DB based on the userId provided in the executionModel
 *
 * @param executionModel
 * @param callback
 */
FreeWidgetExecutor.prototype.getPoolKey = function (executionModel, callback) {
    logger.info('getting pool key');

    managers.db.connect('users', function (db, collection) {
        collection.findOne({'_id': executionModel.getWidget().userId}, function (err, result) {
            if (err) {
                logger.error('unable to find user from widget', err);
                callback(err, executionModel);
                return;
            }

            if (!result) {
                logger.error('result is null for widget');
                callback(new Error('could not find user for widget'), executionModel);
                return;
            }

            logger.info('found poolKey', result.poolKey);
            executionModel.setPoolKey(result.poolKey);
            callback(null, executionModel);
        });
    });
};

/**
 * Mark the machine as occupied.
 *
 * @param executionModel
 * @param callback
 */
FreeWidgetExecutor.prototype.occupyMachine = function (executionModel, callback) {
    logger.info('occupying machine');

    // TODO better defense
    var expires = Date.now() + ( ( executionModel.getWidget().installTimeout || 20 ) * 60 * 1000); //  default to 20 minutes
    logger.info('installation will expire within [%s] minutes - at [%s], or [%s] epoch time', executionModel.getWidget().installTimeout, Date(expires), expires);

    managers.poolClient.occupyPoolNode(executionModel.getPoolKey(), executionModel.getWidget().poolId, expires, function (err, result) {

        if (err) {
            logger.error('occupy node failed');
            callback(err, executionModel);
            return;
        }

        if (!result) {
            logger.error('occupy node result is null');
            callback(new Error('We\'re so hot, that all machines are occupied! Please try again in a few minutes.'), executionModel);
            return;
        }

        var resultObj = result; // todo: callbackWrapper makes this obsolete
        if (typeof result === 'string') {
            try {
                resultObj = JSON.parse(result);
            } catch (e) {
                callback(e, executionModel);
                return;
            }
        }

        executionModel.setNodeModel(resultObj);
        callback(null, executionModel);
    });
};

/**
 * update execution model in DB - add node model
 *
 * @param executionModel
 * @param callback
 */
FreeWidgetExecutor.prototype.updateExecutionModelAddNodeModel = function (executionModel, callback) {
    logger.info('update Execution Model Add Node Model');

    this.updateExecutionModel({
        nodeModel: executionModel.getNodeModel()
    }, executionModel, callback);
};

/**
 * Execute the install command on the Cloudify CLI
 *
 * @param executionModel
 * @param callback
 */
FreeWidgetExecutor.prototype.runInstallCommand = function (executionModel, callback) {
    logger.info('running Install Command');
    var that = this;

    if (!executionModel.getShouldInstall()) {
        var status = {'code': 0};

        services.logs.writeStatus(JSON.stringify(status, null, 4) + '\n', executionModel.getExecutionId());
        services.logs.appendOutput('Install finished successfully.\n', executionModel.getExecutionId());

        that.sendEmailAfterInstall(executionModel);

        callback(null, executionModel);
        return;
    }

    // else -> executionModel.getShouldInstall() = true

    var installPath = executionModel.getDownloadsPath();
    if (executionModel.getWidget().recipeRootPath) {
        try {
            installPath = path.join(executionModel.getDownloadsPath(), executionModel.getWidget().recipeRootPath || ' ');
        } catch (e) {
            callback(new Error('failed while joining install path, one or more of the parameters is not a string: [' +
            executionModel.getDownloadsPath() + '] [' + executionModel.getWidget().recipeRootPath + ']'), executionModel);
            return;
        }
    }

    var command = {
        arguments: [
            'connect',
            executionModel.getNodeModel().machineSshDetails.publicIp,
            ';',
            models.recipeType.getById(executionModel.getWidget().recipeType).installCommand,
            installPath
        ],
        logsDir: executionModel.getLogsPath(),
        executionId: executionModel.getExecutionId()
    };

    // we want to remove the execution model when the execution is over
    services.cloudifyCli.executeCommand(command, function (exErr/*, exResult*/) {
        if (exErr) {
            logger.error('error while running install from cli', exErr);
            return;
        }

        that.sendEmailAfterInstall(executionModel);
        // TODO change execution status
    });

    callback(null, executionModel);
};


//-----------  Private tasks end ----------------------

//-----------  Overrides  ----------------------

FreeWidgetExecutor.prototype.executionType = 'Free';

FreeWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.getWidget.bind(this),
        this.getPoolKey.bind(this),
        this.saveExecutionModel.bind(this),
        this.updateExecutionModelAddPaths.bind(this),
        this.downloadRecipe.bind(this),
        this.occupyMachine.bind(this),
        this.updateExecutionModelAddNodeModel.bind(this),
        this.runInstallCommand.bind(this)
    ];
};

//-----------  Overrides END ----------------------


module.exports = FreeWidgetExecutor;
