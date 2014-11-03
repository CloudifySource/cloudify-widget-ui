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

//sanity test
var sanityDriver = common.getChromeDriver();
sanityDriver.get('http://www.google.com');
var searchBox = sanityDriver.findElement(webDriver.By.name('q'));
searchBox.sendKeys('webDriver');
searchBox.getAttribute('value').then(function(value) {
    assert.equal(value, 'webDriver');
});

sanityDriver.quit();


//xap demo test
var driver = common.getChromeDriver();
driver.get('http://docs.gigaspaces.com/tutorials/xap_cloud_management.html');

utils.waitForElementEnabledById(driver, 'launch', function (launchBtn) {
    logger.info('Clicking on launch btn');
    launchBtn.click();

    utils.waitForElementEnabledById(driver, 'use', function (useLink) {
        useLink.getAttribute('href').then(function (href) {
            logger.info('href = ', href);
            assert(href.indexOf('#') === -1);
        });

    });
});

driver.quit();
