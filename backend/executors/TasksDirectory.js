/**
 * Created by sefi on 26/01/15.
 */
'use strict';

var logger = require('log4js').getLogger('TasksDirectory');
var managers = require('../managers');
var path = require('path');
var _ = require('lodash');
var conf = require('../Conf');

exports.getWidget = function (executionModel, callback) {
    logger.info('getting widget id ' + executionModel.getWidgetId());

    managers.db.connect('widgets', function (db, collection, done) {
        collection.findOne({ _id: executionModel.getWidgetObjectId()}, function (err, result) {
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
        });
    });
};
