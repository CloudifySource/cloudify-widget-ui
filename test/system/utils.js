/**
 * Created by sefi on 03/11/14.
 */
'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var webDriver = require('selenium-webdriver');
var http = require('http');

exports.waitForElementEnabledById = function (driver, elementId, callback, delay) {
    logger.debug('Waiting for element [', elementId, '] to be enabled');

    if (!delay) {
        delay = 15000;
    }

    var element = driver.findElement(webDriver.By.id(elementId));

    driver.wait(function () {
        return element.getCssValue('pointer-events').then(function (value) {
            return value !== 'none';
        });
    }, delay, 'Waited too long').then(function () {
        logger.debug('Done, element is enabled.');
        callback(element);
    });
};

exports.waitForElementDisplayedById = function (driver, elementId, callback, delay) {
    logger.debug('Waiting for element [', elementId, '] to be displayed.');

    if (!delay) {
        delay = 10000;
    }

    var element = driver.findElement(webDriver.By.id(elementId));

    driver.wait(function () {
        if (element.isDisplayed()) {
            return element;
        }
    }, delay, 'Waited too long').then(function () {
        logger.debug('Done, element is displayed');
        callback(element);
    });
};

exports.waitForHttpResponse = function(driver, url, callback, delay) {
    logger.debug('Waiting for get response.');

    if (!delay) {
        delay = 10000;
    }

    var response;
    http.get(url, function(res) {
        response = res;
    });

    driver.wait(function() {
        if (response) {
            return response;
        }
    }, delay, 'Waited too long').then(function () {
        logger.debug('Done, response received');
        callback(response);
    });
};