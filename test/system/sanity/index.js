/**
 * Created by sefi on 02/11/14.
 */
'use strict';
/* jshint -W117 */
/* jshint -W098 */

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var assert = require('assert');
var async = require('async');
var http = require('http');
var Client = require('node-rest-client').Client;
var common = require('../common.js');
var utils = require('../utils.js');
var path = require('path');
var webDriver = require('selenium-webdriver');
var meJson = process.env.ME_JSON && path.resolve(process.env.ME_JSON) || path.resolve(__dirname, '../conf.json');
var conf = require(meJson);


describe('Cloudify Widget System Tests', function () {

    xdescribe('Sanity tests', function () {
        var sanityDriver;

        beforeEach(function (done) {
            sanityDriver = common.getChromeDriver();
            sanityDriver.get('http://www.google.com').then(done);
        });

        afterEach(function (done) {
            common.driverCleanup(sanityDriver, done);
        });

        it('should verify sanity against google', function (done) {
            var searchBox = sanityDriver.findElement(webDriver.By.name('q'));
            searchBox.sendKeys('webDriver');
            searchBox.getAttribute('value').then(function (value) {
                assert.equal(value, 'webDriver');
                done();
            });
        });
    });

    describe('Pool Health', function () {
        var poolHealthDriver;

        beforeEach(function (done) {
            poolHealthDriver = common.getChromeDriver();
            common.performLogin(poolHealthDriver, done, []);
        });

        afterEach(function (done) {
            common.driverCleanup(poolHealthDriver, done);
        });

        it('Should verify that there are bootstrapped nodes', function (done) {
            var url = 'http://thewidget.staging.gsdev.info/backend/admin/pools/'+conf.widget.poolId+'/status';
            common.performSyncRESTGet(poolHealthDriver, url, function (status) {
                assert.notEqual(0, status[conf.widget.poolId].countPerNodeStatus.BOOTSTRAPPED);
                done();
            });
        });
    });

    describe('XAP Demo', function () {
        var xapDemoDriver;

        beforeEach(function (done) {
            xapDemoDriver = common.getChromeDriver();
            xapDemoDriver.get('http://docs.gigaspaces.com/tutorials/xap_cloud_management.html').then(done);
        });

        afterEach(function (done) {
            common.driverCleanup(xapDemoDriver, done);
        });

        it('Should be a successful execution', function (done) {
            utils.waitForElementEnabledById(xapDemoDriver, 'launch', function (launchBtn) {
                logger.debug('Clicking on launch btn');
                launchBtn.click();

                utils.waitForElementEnabledById(xapDemoDriver, 'use', function (useLink) {
                    useLink.getAttribute('href').then(function (href) {
                        logger.debug('href = ', href);
                        assert(href.indexOf('#') === -1);
                        done();
                    });

                });
            });
        });
    });
});
