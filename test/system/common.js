/**
 * Created by sefi on 02/11/14.
 */
'use strict';

var webdriver = require('selenium-webdriver');
var path = require('path');
var meJson = process.env.CLOUDIFY_WIDGET_SYSTEM_TESTS_JSON && path.resolve(process.env.CLOUDIFY_WIDGET_SYSTEM_TESTS_JSON) || path.resolve('../conf.json');
var conf = require(meJson);

exports.getChromeDriver = function() {
    var driver = new webdriver.Builder()
        .usingServer(conf.serverLocation)
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    return driver;
};
