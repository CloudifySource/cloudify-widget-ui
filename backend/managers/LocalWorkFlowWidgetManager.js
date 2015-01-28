/**
 * Created by liron on 12/30/14.
 */
'use strict';

var logger = require('log4js').getLogger('LocalWorkFlowWidgetManager');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var LocalSoloExecutor = require('./LocalSoloExecutor');


/**
 * @param {SoloExecutorConfiguration} opts
 */
exports.localSoloInstallationProcess = function (opts, callback) {

    try {
        opts = _.merge({'configPrototype': path.resolve(__dirname, '..', 'cfy-config-softlayer')}, opts);

        var soloExecutor = new LocalSoloExecutor();

        soloExecutor.setConfiguration(opts);

        var tasks = [

            soloExecutor.setupDirectory,
            soloExecutor.setupSoftlayerCli,
            soloExecutor.setupSoftlayerSsh,
            //
            soloExecutor.editInputsFile,
            soloExecutor.init,
            soloExecutor.installWorkflow
        ];


        // wrap tasks with try/catch to propagate errors properly.
        tasks = _.map(tasks, function (fn) {
            return function (callback) {
                try {
                    fn.apply(soloExecutor, arguments);
                } catch (e) {
                    logger.error('task got an error', e);
                    callback(new Error('task got an error', e));
                }
            };
        });

        async.waterfall(tasks, function (err) {
            logger.debug('finished running solo installation process');

            try {
                soloExecutor.clean();
            } catch (e) {
                logger.warn('unable to clean', e);
            }

            if (!!err) {
                callback('failed installing solo', err);
                // throw new Error(err.getMessage());
                //return;
            }
        });

    } catch (e) {
        logger.error('solo installation failed', e);
        callback(new Error('unable to run solo installation : ' + e.message));
    }


};




