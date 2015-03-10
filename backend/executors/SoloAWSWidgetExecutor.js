/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var AbstractWidgetExecutor = require('./AbstractWidgetExecutor');
var logger = require('log4js').getLogger('TasksDirectory');
var services = require('../services');
var path = require('path');
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
        },
        loginDetails: details.leadDetails,
        recipeProperties: details.recipeProperties

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
    var that = this;

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

            that.updateExecutionModel({
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
    var that = this;

    logger.info('installTimeout:', installTimeout);
    logger.info('runCliBootstrapCommand, JOIN:', installPath);

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

    services.cloudifyCli.executeCommand(command, function(err, result) {
        if (err) {
            logger.info('err: ' + err + '\noutput: ' + result.output);
            callback(new Error('execution failed'), executionModel);
            return;
        }

        logger.info('output: ' + result.output);

        services.logs.locateLineWithCriteria(result.output, 'New machine is allocated', function(err, line) {
            if (err) {
                logger.info('\nCould not find host IP.');
                callback(new Error('could not find line with host IP.'), executionModel);
                return;
            }

            executionModel.getExecutionDetails().publicIp = line.substring(line.indexOf('[') + 1, line.length - 1);

            that.sendEmailAfterInstall(executionModel);
            callback(null, executionModel);

        });
    });
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
SoloAWSWidgetExecutor.prototype.executionType = 'Solo AWS';

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

/**
 * See {@link AbstractWidgetExecutor#getSendMailData(executionModel, mandrillConfig)}
 */
SoloAWSWidgetExecutor.prototype.getSendMailData = function (executionModel, mandrillConfig) {
    var fullname = executionModel.executionDetails.leadDetails.firstName + ' ' + executionModel.executionDetails.leadDetails.lastName;
    var publicIp = executionModel.getExecutionDetails().publicIp;

    var templateContent = [
        {
            'name': 'link',
            'content': '<a href="http://"' + publicIp + '> http://' + publicIp + '</a>'
        },
        {
            'name': 'name',
            'content': fullname
        },
        {
            'name': 'publicIp',
            'content': publicIp
        }
    ];

    var db2express = executionModel.executionDetails.recipeProperties.filter(function (item) {
        if (item.key === 'db2expressRandomValue') {
            return item;
        }
    });

    if (db2express.length > 0) {
        templateContent.push(
            {
                'name': 'db2expressRandomValue',
                'content': db2express[0].value
            }
        );
    }

    var data = {
        'apiKey': mandrillConfig.apiKey,
        'template_name': mandrillConfig.templateName,
        'template_content': templateContent,
        'message': {
            'to': [
                {
                    'email': executionModel.executionDetails.leadDetails.email,
                    'name': fullname,
                    'type': 'to'
                }
            ]
        },
        'async': true
    };

    return data;
};

SoloAWSWidgetExecutor.prototype.getExecutionTasks = function () {
    return [
        this.getWidget.bind(this),
        this.updateExecutionModelAddPaths.bind(this),
        this.updateExecutionModelAddExecutionDetails.bind(this),
        this.downloadRecipe.bind(this),
        this.downloadCloudProvider.bind(this),
        this.generateKeyPair.bind(this),
        this.modifyImages.bind(this),
        this.overrideCloudPropertiesFile.bind(this),
        this.overrideRecipePropertiesFile.bind(this),
        this.runBootstrapAndInstallCommands.bind(this)
    ];
};

//-----------  Overrides END ----------------------


module.exports = SoloAWSWidgetExecutor;
