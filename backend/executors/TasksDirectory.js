/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var logger = require('log4js').getLogger('TasksDirectory');
var managers = require('../managers');
var services = require('../services');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var conf = require('../Conf');
var models = require('../models');

var sendEmailAfterInstall = function (executionModel) {
    var widget = executionModel.getWidget();

    if (!widget.socialLogin || !widget.socialLogin.handlers || !widget.socialLogin.handlers.mandrill || !widget.socialLogin.handlers.mandrill.enabled) {
        // noop
        return;
    }

    var mandrillConfig = widget.socialLogin.handlers.mandrill;
    var publicIp = executionModel.getNodeModel().machineSshDetails.publicIp;
    var link = '<a href="http://"' + publicIp + '> http://' + publicIp + '</a>';

    managers.widgetLogins.getWidgetLoginById(executionModel.getLoginDetailsId(), function (err, result) {
        if (err) {
            logger.error('unable to find login details, email send failed', err);
            return;
        }

        if (!result) {
            logger.error('result is null for login details find, email send failed');
            return;
        }

        var fullname = result.loginDetails.name + ' ' + result.loginDetails.lastName;

        var data = {
            'apiKey': mandrillConfig.apiKey,
            'template_name': mandrillConfig.templateName,
            'template_content': [
                {
                    'name': 'link',
                    'content': link
                },
                {
                    'name': 'name',
                    'content': fullname
                },
                {
                    'name': 'randomValue',
                    'content': executionModel.getNodeModel().randomValue
                },
                {
                    'name': 'publicIp',
                    'content': publicIp
                }
            ],
            'message': {
                'to': [
                    {
                        'email': result.loginDetails.email,
                        'name': fullname,
                        'type': 'to'
                    }
                ]
            },
            'async': true
        };

        services.mandrill.sendMandrillTemplate(data,
            function (err, result) {
                if (err) {
                    executionModel.getWidget().socialLogin.handlers.mandrill.status = err;
                } else {
                    executionModel.getWidget().socialLogin.handlers.mandrill.status = result;
                }
            });
    });
};

var updatePropertiesFile = function (fileName, updateLine, callback) {
    logger.info('---updateLine', updateLine);
    fs.appendFile(fileName, updateLine, callback);
};

var getRecipePropertiesUpdateLine = function (executionDetails) {
    var updateLine = '';

    if (executionDetails.recipeProperties) {
        for (var i = 0; i < executionDetails.recipeProperties.length; i++) {
            var prop = executionDetails.recipeProperties[i];

            if (_.isNumber(prop.value)) {
                updateLine += prop.key + '=' + prop.value + '\n';
            } else {
                updateLine += prop.key + '="' + prop.value + '"\n';
            }
        }
    }

    return updateLine;
};

var getCloudPropertiesUpdateLine = function (executionDetails, executionId) {
    var updateLine = '';

    if (executionDetails.SOFTLAYER) {
        var username = executionDetails.SOFTLAYER.params.username;
        var apiKey = executionDetails.SOFTLAYER.params.apiKey;
        updateLine =
            'user=' + username + '\n' +
            'apiKey="' + apiKey + '"';
    }
    else if (executionDetails.HP) {
        var key = executionDetails.HP.params.key;
        var secretKey = executionDetails.HP.params.secretKey;
        var project = executionDetails.HP.params.project;
        updateLine =
            'tenant="' + project + '"\n' +
            'user="' + key + '"\n' +
            'apiKey="' + secretKey + '"';
        /*
         'keyFile="' + newPemFile.getName() + '.pem"';
         'keyPair="' + newPemFile.getName() + '"';
         'securityGroup="' + cloudConf.securityGroup + '"';
         */
    } else if (executionDetails.EC2) {
        var ec2user = executionDetails.EC2.params.apiKey;
        var ec2apiKey = executionDetails.EC2.params.secretKey;
        var ec2keyPair = executionDetails.EC2.params.keyPair.KeyName;

        updateLine =
            '\n\nuser="' + ec2user + '"\n' +
            'apiKey="' + ec2apiKey + '"\n' +
            'keyPair="' + ec2keyPair + '"\n' +
            'keyFile="keyFile.pem"\n' +
            'machineNamePrefix="cloudify-agent-widget-' + executionId + '"\n' +
            'managementGroup="cloudify-manager-widget-' + executionId + '"\n';
    }

    updateLine += getRecipePropertiesUpdateLine(executionDetails);

    return updateLine;
};

//---------------- COMMON TASKS ------------------------

exports.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());

    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({_id: executionModel.getWidgetObjectId()}, function (err, result) {
            if (err) {
                logger.error('unable to find widget', err);
                callback(err, executionModel);
                done();
                return;
            }

            if (!result) {
                logger.error('result is null for widget find');
                callback(new Error('could not find widget'), executionModel);
                done();
                return;
            }

            executionModel.setWidget(result);
            callback(null, executionModel);
            done();
            return;
        });
    });
};

exports.saveExecutionModel = function (executionModel, callback) {
    logger.info('saving execution to mongo');

    managers.db.connect('widgetExecutions', function (db, collection, done) {
        // instantiate the execution model with the widget data, and remove the _id - we want mongodb to generate a unique id
        var storedExecutionModel = {};
        storedExecutionModel.widget = executionModel.getWidget();
        storedExecutionModel.loginDetailsId = executionModel.getLoginDetailsId();
        storedExecutionModel.state = 'RUNNING';

        collection.insert(storedExecutionModel, function (err, docsInserted) {
            if (err) {
                logger.error('failed to store widget execution model to DB', err);
                callback(err, executionModel);
                done();
                return;
            }

            if (!docsInserted) {
                logger.error('no widget execution docs inserted to database');
                callback(new Error('no widget execution docs inserted to database'), executionModel);
                done();
                return;
            }

            executionModel.setExecutionObjectId(docsInserted[0]._id);
            callback(null, executionModel);
            done();
            return;
        });
    });
};

exports.updateExecutionModel = function (data, executionModel, callback) {
    managers.db.connect('widgetExecutions', function (db, collection, done) {
        collection.findOne(
            {_id: executionModel.getExecutionObjectId()},
            function (err, result) {
                if (err) {
                    logger.error('failed to retrieve execution model before update', err);
                    callback(err, executionModel);
                    done();
                    return;
                }

                result = _.merge(result, data);

                collection.update(
                    {_id: executionModel.getExecutionObjectId()},
                    result,
                    function (err, nUpdated) {
                        if (err) {
                            logger.error('failed updating widget execution model', err);
                            callback(err, executionModel);
                            done();
                            return;
                        }

                        if (!nUpdated) {
                            logger.error('no widget execution docs updated in the database');
                            callback(new Error('no widget execution docs updated in the database'), executionModel);
                            done();
                            return;
                        }

                        callback(null, executionModel);
                        done();
                        return;
                    });
            });
    });
};

exports.updateExecutionModelAddPaths = function (executionModel, callback) {
    logger.info('updating execution model add paths');

    executionModel.setExecutionId(executionModel.getExecutionObjectId().toHexString());
    executionModel.setDownloadsPath(path.join(conf.downloadsDir, executionModel.getExecutionId()));
    executionModel.setLogsPath(path.join(conf.logsDir, executionModel.getExecutionId()));

    exports.updateExecutionModel({
        downloadsPath: executionModel.getDownloadsPath(),
        logsPath: executionModel.getLogsPath()
    }, executionModel, callback);
};

exports.downloadRecipe = function (executionModel, callback) {
    // TODO : add validation if destination download not already exists otherwise simply call callback.
    logger.info('downloading recipe from ', executionModel.getWidget().recipeUrl);
    // download recipe zip
    var options = {
        destDir: executionModel.getDownloadsPath(),
        url: executionModel.getWidget().recipeUrl,
        extract: true
    };

    if (!options.url) {
        executionModel.setShouldInstall(false);
        callback(null, executionModel);
        return;

    } else {
        executionModel.setShouldInstall(true);
        services.dl.downloadZipfile(options, function (e) {
            callback(e, executionModel);
            return;
        });
    }
};

exports.downloadCloudProvider = function (executionModel, callback) {
    // TODO : add validation if destination download not already exists otherwise simply call callback.
    logger.info('downloading Cloud Provider from ', executionModel.getExecutionDetails().providerUrl);

    var options = {
        destDir: executionModel.getDownloadsPath(),
        url: executionModel.getExecutionDetails().providerUrl,
        extract: true
    };

    services.dl.downloadZipfile(options, function (e) {
        callback(e, executionModel);
        return;
    });

};

exports.overrideCloudPropertiesFile = function (executionModel, callback) {
    logger.info('overriding Cloud Properties File');

    var cloudDistFolderName = executionModel.getDownloadsPath() + path.sep + executionModel.getWidget().executionDetails.providerRootPath;
    executionModel.setCloudDistFolderName(cloudDistFolderName);
    var cloudName = executionModel.getWidget().executionDetails.providerName;
    var cloudPropertiesFile = cloudDistFolderName + path.sep + cloudName + '-cloud.properties';
    var executionDetails = executionModel.getExecutionDetails();
    var updateLine = getCloudPropertiesUpdateLine(executionDetails, executionModel.getExecutionId());

    updatePropertiesFile(cloudPropertiesFile, updateLine, function (err) {
        if (err) {
            logger.info(err);
            callback(err, executionModel);
            return;
        }

        logger.info('Cloud Properties File was updated:', cloudPropertiesFile);
        callback(null, executionModel);
        return;
    });

};

exports.overrideRecipePropertiesFile = function (executionModel, callback) {
    logger.trace('overriding Recipe Properties File');

    var widget = executionModel.getWidget();
    var recipeDistFolderName = executionModel.getDownloadsPath() + path.sep + widget.recipeRootPath;
    executionModel.setRecipeDistFolderName(recipeDistFolderName);
    // filename - assuming that the file format is 'recipeName'-'recipeType'.properties i.e. mongod-service.properties
    var recipePropertiesFile = recipeDistFolderName + path.sep + widget.recipeName + '-' + widget.recipeType + '.properties';
    var executionDetails = executionModel.getExecutionDetails();
    var updateLine = getRecipePropertiesUpdateLine(executionDetails);

    updatePropertiesFile(recipePropertiesFile, updateLine, function (err) {
        if (err) {
            logger.info(err);
            callback(err, executionModel);
            return;
        }

        logger.info('Recipe Properties File was updated:', recipePropertiesFile);
        callback(null, executionModel);
        return;
    });

};

//---------------- COMMON TASKS END ------------------------

//---------------- FREE TASKS ------------------------

exports.getPoolKey = function (executionModel, callback) {
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
            return;
        });
    });
};

exports.occupyMachine = function (executionModel, callback) {
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
        return;
    });
};

exports.updateExecutionModelAddNodeModel = function (executionModel, callback) {
    logger.info('update Execution Model Add Node Model');

    exports.updateExecutionModel({
        nodeModel: executionModel.getNodeModel()
    }, executionModel, callback);
};

exports.runInstallCommand = function (executionModel, callback) {
    logger.info('running Install Command');

    if (!executionModel.getShouldInstall()) {
        var status = {'code': 0};

        services.logs.writeStatus(JSON.stringify(status, null, 4) + '\n', executionModel.getExecutionId());
        services.logs.appendOutput('Install finished successfully.\n', executionModel.getExecutionId());

        sendEmailAfterInstall(executionModel);

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
        executionId: executionModel.getExecutionObjectId().toHexString()
    };

    // we want to remove the execution model when the execution is over
    services.cloudifyCli.executeCommand(command, function (exErr/*, exResult*/) {
        if (exErr) {
            logger.error('error while running install from cli', exErr);
            return;
        }

        sendEmailAfterInstall(executionModel);
        // TODO change execution status
    });

    callback(null, executionModel);
    return;
};

//---------------- FREE TASKS END ------------------------


//---------------- SOLO AWS TASKS ------------------------

exports.updateExecutionModelAddExecutionDetails = function (executionModel, callback) {
    logger.trace('updating Execution Model Add Execution Details');

    var encryptionKey = executionModel.getExecutionId();
    var details = executionModel.getExecutionDetails();

    if (!details.EC2 || !details.EC2.params || !details.EC2.params.apiKey || !details.EC2.params.secretKey) {
        callback(new Error('Cloud provider apiKey and secretKey are mandatory fields!'), executionModel);
        return;
    }

    exports.updateExecutionModel({
        cloudProvider: {
            EC2: {
                apiKey: services.crypto.encrypt(encryptionKey, details.EC2.params.apiKey),
                secretKey: services.crypto.encrypt(encryptionKey, details.EC2.params.secretKey)
            }
        }
    }, executionModel, callback);

};

exports.generateKeyPair = function (executionModel, callback) {
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

            exports.updateExecutionModel({
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

exports.modifyImages = function (executionModel, callback) {
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
        return;
    });
};

exports.runBootstrapAndInstallCommands = function (executionModel, callback) {
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
        executionId: executionModel.getExecutionObjectId().toHexString()
    };

    logger.info('-command', command);

    services.cloudifyCli.executeCommand(command);

    callback(null, executionModel);
    return;
};

//---------------- SOLO AWS TASKS END ------------------------
