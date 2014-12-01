/**
 * Created by sefi on 09/11/14.
 */
'use strict';
/* jshint -W117 */
/* jshint -W098 */
var log4js = require('log4js');
var logger = log4js.getLogger('index');
var webDriver = require('selenium-webdriver');
var path = require('path');
var meJson = process.env.ME_JSON && path.resolve(process.env.ME_JSON) || path.resolve(__dirname, 'conf.json');
var conf = require(meJson);

function GsDriver () {
    this.driverInstance = undefined;
}

GsDriver.prototype.chrome = function() {
    this.driverInstance = new webDriver.Builder()
        .usingServer(conf.seleniumServerLocation)
        .withCapabilities(webDriver.Capabilities.chrome())
        .build();

    return this.driverInstance;
};

GsDriver.prototype.driver = function() {
    return this.driverInstance;
};

GsDriver.prototype.cleanup = function(done, delay) {
    delay = delay || 2000;
    var that = this;

    webDriver.promise.delayed(delay).then(function () {
        that.driverInstance.close().then(function () {
            logger.info('Closing web browser');
            that.driverInstance.quit();
            done();
        });
    });
};

module.exports = GsDriver;
