/**
 * Created by sefi on 03/11/14.
 */
'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var webDriver = require('selenium-webdriver');

exports.waitForElementEnabledById = function (driver, elementId, callback, delay) {
    logger.info('Waiting for element [', elementId, '] to be enabled');

    if (!delay) {
        delay = 15000;
    }

    var element = driver.findElement(webDriver.By.id(elementId));

    driver.wait(function () {
        return element.getCssValue('pointer-events').then(function (value) {
            return value !== 'none';
        });
    }, delay, 'Waited too long').then(function () {
        logger.info('Done, element is enabled.');
        callback(element);
    });
};

exports.waitForElementDisplayedById = function (driver, elementId, callback, delay) {
    logger.info('Waiting for element [', elementId, '] to be displayed.');

    if (!delay) {
        delay = 10000;
    }

    var element = driver.findElement(webDriver.By.id(elementId));

    driver.wait(function () {
        if (element.isDisplayed()) {
            return element;
        }
    }, delay, 'Waited too long').then(function () {
        logger.info('Done, element is displayed');
        callback(element);
    });
};