/**
 * Created by sefi on 02/11/14.
 */
'use strict';
/* jshint -W117 */
/* jshint -W098 */

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var lodash = require('lodash');
var webDriver = require('selenium-webdriver');
var async = require('async');
var path = require('path');
var meJson = process.env.ME_JSON && path.resolve(process.env.ME_JSON) || path.resolve(__dirname, 'conf.json');
var conf = require(meJson);

try {
    var overrideJSON = path.resolve(__dirname, 'conf/dev/conf-override.json');
    var overrideConf = require(overrideJSON);
    console.log(conf);
    console.log(overrideConf);
    lodash.merge(conf, overrideConf);
} catch (e) {
    logger.debug('There is no me-override.json file', e);
}

exports.getChromeDriver = function () {
    var driver = new webDriver.Builder()
        .usingServer(conf.serverLocation)
        .withCapabilities(webDriver.Capabilities.chrome())
        .build();

    return driver;
};

exports.getLoginCredentials = function () {
    var args = {
        data: {
            email: conf.login.widget.admin.email,
            password: conf.login.widget.admin.password
        },
        headers: {'Content-Type': 'application/json'}
    };

    return args;
};

exports.performLogin = function (driver, done, validationFunctions) {
    var steps = [
        function getLoginPage(callback) {
            logger.debug('Getting login page');
            driver.get('http://thewidget.staging.gsdev.info/#/login').then(function () {
                callback();
            });
        },
        function waitForInputs(callback) {
            logger.debug('Waiting for inputs to become available.');
            driver.wait(function () {
                return driver.isElementPresent(webDriver.By.css('input[ng-model=\'page.email\']'));
            }, 10000, 'Unable to find login fields').then(function () {
                logger.debug('Found');
                callback();
            });
        },
        function waitForInputsDisplayed(callback) {
            logger.debug('Waiting for input to become displayed.');
            driver.wait(function () {
                return driver.findElement(webDriver.By.css('input[ng-model=\'page.email\']')).isDisplayed().then(function (isDisplayed) {
                    return isDisplayed;
                });
            }, 5000, 'Input did not appear').then(function () {
                logger.debug('input displayed.');
                callback();
            });
        },
        function findInputs(callback) {
            logger.debug('Finding login input fields');
            driver.findElements(webDriver.By.css('input')).then(function (elements) {
                logger.debug('Found ', elements.length, ' input fields.');
                callback(null, elements);
            });
        },
        function fillForm(elements, callback) {
            logger.debug('Fill inputs with login data.');
            elements[0].sendKeys(conf.login.widget.admin.email);
            elements[1].sendKeys(conf.login.widget.admin.password);
            callback(null, elements[2]);
        },
        function submitForm(submitBtn, callback) {
            submitBtn.click().then(function () {
                callback();
            });

        }]
        .concat(validationFunctions)
        .concat([
            function finishLogin(callback) {
                logger.debug('Login finished.');
                callback();
            }
        ]);

    async.waterfall(steps, function (err) {
        if (err) {
            logger.error('Login failed!', err);
            return;
        }

        logger.info('Login successful.');
        webDriver.promise.delayed(5000).then(function () {
            //wait for redirect after login.
            done();
        });
    });
};

exports.performREST = function (driver, url, callback) {
    driver.executeAsyncScript(function () {
        var callback = arguments[arguments.length - 1];
        var xhr = new XMLHttpRequest();
        xhr.open('GET', arguments[0], false);
        xhr.send('');
        callback(xhr.responseText);
    }, url).then(function (str) {
        var status = JSON.parse(str);
        callback(status);
    });
};