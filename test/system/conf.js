/**
 * Created by sefi on 09/11/14.
 */
'use strict';
var _ = require('lodash');
var path = require('path');

var meConf = {};
try{ meConf = process.env.ME_CONF && path.resolve(process.env.ME_CONF) || path.resolve(__dirname, 'conf/dev/conf-override.json');}catch(e){}
exports.conf = _.merge({}, require(meConf));