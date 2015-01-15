/**
 * Created by sefi on 02/11/14.
 */
'use strict';
/* jshint -W117 */
/* jshint -W098 */

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var webDriver = require('selenium-webdriver');
var async = require('async');
var conf = require('./conf').conf;

exports.getLoginCredentials = function () {
    var args = {
        data: {
            email: conf.widget.login.admin.email,
            password: conf.widget.login.admin.password
        },
        headers: {'Content-Type': 'application/json'}
    };

    return args;
};

exports.performLogin = function (driver, done, validationFunctions) {
    var steps = [
        function getLoginPage(callback) {
            logger.debug('Getting login page');
            driver.get(conf.widget.login.url).then(function () {
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
            elements[0].sendKeys(conf.widget.login.admin.email);
            elements[1].sendKeys(conf.widget.login.admin.password);
            callback(null, elements[2]);
        },
        function submitForm(submitBtn, callback) {
            submitBtn.click().then(function () {
                callback();
            });

        }
    ]
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

/**
 * This is a synced REST get request because of selenium limitation.
 *
 * @param driver
 * @param url
 * @param callback
 */
exports.performSyncRESTGet = function (driver, url, callback) {
    driver.executeAsyncScript(function () {
        var callback = arguments[arguments.length - 1];
        var xhr = new XMLHttpRequest();
        // this xhr is NOT ASYNC!!!
        xhr.open('GET', arguments[0], false);
        xhr.send('');
        callback(xhr.responseText);
    }, url).then(function (str) {
        var status = JSON.parse(str);
        callback(null, status);
    });
};