/**
 * Created by sefi on 02/11/14.
 */
'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var assert = require('assert');
var common = require('../common.js');
var utils = require('../utils.js');
var webDriver = require('selenium-webdriver');
//var driver = common.getChromeDriver();

//var waitForValidLink = function(element, callback) {
//    logger.info('Waiting for link to be valid');
//    driver.wait(function () {
//        return element.getAttribute('href').then(function (value) {
//            return value !== '#';
//        });
//    }, 15000, 'Waited too long').then(function () {
//        logger.debug('Done!');
//        callback();
//    });
//
//};

// sanity test

//    driver.get('http://www.google.com');
//    var searchBox = driver.findElement(webDriver.By.name('q'));
//    searchBox.sendKeys('webDriver');
//    searchBox.getAttribute('value').then(function(value) {
//        assert.equal(value, 'webDriver');
//    });
//
//    driver.quit();


//xap demo test
var driver = common.getChromeDriver();
driver.get('http://docs.gigaspaces.com/tutorials/xap_cloud_management.html');

utils.waitForElementEnabledById(driver, 'launch', function (launchBtn) {
    logger.info('Clicking on launch btn');
    launchBtn.click();

    utils.waitForElementEnabledById(driver, 'use', function (useLink) {
//        var useLink = driver.findElement(webDriver.By.id('use'));
        useLink.getAttribute('href').then(function (href) {
            logger.info('href = ', href);
            assert(href.indexOf('#') === -1);
        });

    });
});

driver.quit();
