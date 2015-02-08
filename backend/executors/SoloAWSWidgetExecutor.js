/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('TasksDirectory');
var services = require('../services');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var util = require('util');

function SoloAWSWidgetExecutor() {
    AbstractWidgetExecutor.call(this);
}

util.inherits(SoloAWSWidgetExecutor, AbstractWidgetExecutor);

//-----------  Private tasks  ----------------------
/**
 * Update execution model in DB - add execution details
 * sensitive info is encrypted prior to the update.
 * i.e. apiKey, secretKey etc.
 *
 * @param executionModel
 * @param callback
 */
SoloAWSWidgetExecutor.prototype.updateExecutionModelAddExecutionDetails = function (executionModel, callback) {
    logger.trace('updating Execution Model Add Execution Details');

    var encryptionKey = executionModel.getExecutionId();
    var details = executionModel.getExecutionDetails();

    if (!details.EC2 || !details.EC2.params || !details.EC2.params.apiKey || !details.EC2.params.secretKey) {
        callback(new Error('Cloud provider apiKey and secretKey are mandatory fields!'), executionModel);
        return;
    }

    this.updateExecutionModel({
        cloudProvider: {
            EC2: {
                apiKey: services.crypto.encrypt(encryptionKey, details.EC2.params.apiKey),
                secretKey: services.crypto.encrypt(encryptionKey, details.EC2.params.secretKey)
            }
        }
    }, executionModel, callback);

};

/**
 * Generate EC2 keyPair and store it encrypted in DB.
 *
 * @param executionModel
 * @param callback
 */
SoloAWSWidgetExecutor.prototype.generateKeyPair = function (executionModel, callback) {
    logger.trace('Generating Key Pair');

    var executionDetails = executionModel.getExecutionDetails();
    var encryptionKey = executionModel.getExecutionId();

    if (!executionDetails.EC2) {
        callback(null, executionModel);
        return;
    }

    services.ec2Api.createKeyPair(executionDetails.EC2.params.apiKey, executionDetails.EC2.params.secretKey, 'us-east-1', 'Cloudify-Widget-' + executionModel.getExecutionId(), function (err, data) {
        if (err) {
            callback(err, executionModel);
            return;
        }

        //create pem file
        var keyPairPemFile = executionModel.getDownloadsPath() + path.sep + executionModel.getWidget().executionDetails.providerRootPath + path.sep + 'upload/keyFile.pem';
        fs.appendFile(keyPairPemFile, data.KeyMaterial, function (err) {
            if (err) {
                callback(err, executionModel);
                return;
            }

            fs.chmodSync(keyPairPemFile, '600');

            executionModel.getExecutionDetails().EC2.params.keyPair = data;

            this.updateExecutionModel({
                cloudProvider: {
                    EC2: {
                        keyPairName: services.crypto.encrypt(encryptionKey, data.KeyName),
                        keyPairSecret: services.crypto.encrypt(encryptionKey, data.KeyMaterial),
                        keyPairFile: keyPairPemFile
                    }
                }
            }, executionModel, callback);
        });

    });
};

/**
 * Update EC2 private images - add exceptions for the apiKey so that they will be usable.
 *
 * @param executionModel
 * @param callback
 */
SoloAWSWidgetExecutor.prototype.modifyImages = function (executionModel, callback) {
    logger.trace('Modifying images');

    var executionDetails = executionModel.getExecutionDetails();

    if (!executionDetails.EC2 || !executionDetails.privateImages || executionDetails.privateImages.length === 0) {
        // not EC2 or no private images, nothing to do.
        callback(null, executionModel);
        return;
    }

    var data = {
        action: 'add',
        apiKey: executionDetails.EC2.params.apiKey,
        secretKey: executionDetails.EC2.params.secretKey,
        images: executionDetails.privateImages
    };

    services.ec2Api.modifyImages(data, function (err) {
        if (err) {
            callback(err, executionModel);
            return;
        }

        callback(null, executionModel);
    });
};

/**
 * Execute bootstrap and install commands on the Cloudify CLI
 *
 * @param executionModel
 * @param callback
 */
SoloAWSWidgetExecutor.prototype.runBootstrapAndInstallCommands = function (executionModel, callback) {
    var widget = executionModel.getWidget();

    logger.info('runCliBootstrapCommand, LogsPath:', executionModel.getLogsPath(), 'installCommand:', widget.recipeType.installCommand);
    logger.info('runCliBootstrapCommand, DownloadsPath:', executionModel.getDownloadsPath(), 'recipeRootPath:', widget.recipeRootPath);

    var installPath = path.resolve(path.join(executionModel.getDownloadsPath(), widget.recipeRootPath));
    var installTimeout = widget.installTimeout;

    logger.info('installTimeout:', installTimeout);
    logger.info('runCliBootstrapCommand, JOIN:', installPath);
    //logger.info('-installPath after handlingseparators:', installPath);

    var command = {
        arguments: [
            'bootstrap-cloud',
            executionModel.getCloudDistFolderName(),
            ';',
            'install-service -disableSelfHealing -timeout',
            installTimeout,
            installPath
        ],
        logsDir: executionModel.getLogsPath(),
        executionId: executionModel.getExecutionId()
    };

    logger.info('-command', command);

    services.cloudifyCli.executeCommand(command);

    callback(null, executionModel);
};

/**
 * see getCloudPropertiesUpdateLineInner(executionDetails, executionId).
 *
 * @param executionModel
 * @param callback
 */
SoloAWSWidgetExecutor.prototype.overrideCloudPropertiesFile = function (executionModel, callback) {
    logger.info('overriding Cloud Properties File');

    var cloudDistFolderName = executionModel.getDownloadsPath() + path.sep + executionModel.getWidget().executionDetails.providerRootPath;
    executionModel.setCloudDistFolderName(cloudDistFolderName);
    var cloudName = executionModel.getWidget().executionDetails.providerName;
    var cloudPropertiesFile = cloudDistFolderName + path.sep + cloudName + '-cloud.properties';
    var executionDetails = executionModel.getExecutionDetails();
    var updateLine = this.getCloudPropertiesUpdateLine(executionDetails, executionModel.getExecutionId());

    this.updatePropertiesFile(cloudPropertiesFile, updateLine, function (err) {
        if (err) {
            logger.info(err);
            callback(err, executionModel);
            return;
        }

        logger.info('Cloud Properties File was updated:', cloudPropertiesFile);
        callback(null, executionModel);
    });

};

//-----------  Private tasks end ----------------------

//-----------  Overrides  ----------------------
SoloAWSWidgetExecutor.prototype.getCloudPropertiesUpdateLineInner = function (executionDetails, executionId) {
    var ec2user = executionDetails.EC2.params.apiKey;
    var ec2apiKey = executionDetails.EC2.params.secretKey;
    var ec2keyPair = executionDetails.EC2.params.keyPair.KeyName;

    var updateLine =
        '\n\nuser="' + ec2user + '"\n' +
        'apiKey="' + ec2apiKey + '"\n' +
        'keyPair="' + ec2keyPair + '"\n' +
        'keyFile="keyFile.pem"\n' +
        'machineNamePrefix="cloudify-agent-widget-' + executionId + '"\n' +
        'managementGroup="cloudify-manager-widget-' + executionId + '"\n';

    return updateLine;
};

SoloAWSWidgetExecutor.prototype.executionType = 'Solo AWS';

SoloAWSWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.getWidget,
        this.saveExecutionModel,
        this.updateExecutionModelAddPaths,
        this.updateExecutionModelAddExecutionDetails,
        this.downloadRecipe,
        this.downloadCloudProvider,
        this.generateKeyPair,
        this.modifyImages,
        this.overrideCloudPropertiesFile,
        this.overrideRecipePropertiesFile,
        this.runBootstrapAndInstallCommands
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloAWSWidgetExecutor;
