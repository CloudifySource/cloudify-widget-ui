/**
 * Created by sefi on 02/11/14.
 */
'use strict';

var conf = require('./conf.json');
var webdriver = require('selenium-webdriver');

exports.getChromeDriver = function() {
    var driver = new webdriver.Builder()
        .usingServer(conf.serverLocation)
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    return driver;
};
