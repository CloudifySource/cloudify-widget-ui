/**
 * Created by sefi on 02/11/14.
 */
'use strict';
/* jshint -W117 */
/* jshint -W098 */

var log4js = require('log4js');
var logger = log4js.getLogger('index');
var assert = require('assert');
var common = require('../common.js');
var waitUtils = require('../waitUtils.js');
var webDriver = require('selenium-webdriver');
var conf = require('../conf').conf;

var GsDriver = require('../GsDriver');
var gsDriver;

describe('Cloudify Widget System Tests', function () {

    // that's just to verify that the tests are working. Should be run usually.
    xdescribe('Sanity tests', function () {

        beforeEach(function (done) {
            gsDriver = new GsDriver();
            gsDriver.chrome();
            gsDriver.driver().get('http://www.google.com').then(done);
        });

        afterEach(function (done) {
            gsDriver.cleanup(done);
        });

        it('should verify sanity against google', function (done) {
            var searchBox = gsDriver.driver().findElement(webDriver.By.name('q'));
            searchBox.sendKeys('webDriver');
            searchBox.getAttribute('value').then(function (value) {
                assert.equal(value, 'webDriver');
                done();
            });
        });
    });

    describe('Pool Health', function () {

        beforeEach(function (done) {
            gsDriver = new GsDriver();
            gsDriver.chrome();
            common.performLogin(gsDriver.driver(), done, []);
        });

        afterEach(function (done) {
            gsDriver.cleanup(done);
        });

        it('Should verify that there are bootstrapped nodes', function (done) {
            var url = 'http://thewidget.staging.gsdev.info/backend/admin/pools/'+conf.widget.poolId+'/status';
            common.performSyncRESTGet(gsDriver.driver(), url, function (err, status) {
                assert.notEqual(0, status[conf.widget.poolId].countPerNodeStatus.BOOTSTRAPPED);
                done();
            });
        });
    });

    describe('XAP Demo', function () {

        beforeEach(function (done) {
            gsDriver = new GsDriver();
            gsDriver.chrome();
            gsDriver.driver().get('http://docs.gigaspaces.com/tutorials/xap_cloud_management.html').then(done);
        });

        afterEach(function (done) {
            gsDriver.cleanup(done);
        });

        it('Should be a successful execution', function (done) {
            waitUtils.waitForElementEnabledById(gsDriver.driver(), 'launch', function (launchBtn) {
                logger.debug('Clicking on launch btn');
                launchBtn.click();

                waitUtils.waitForElementEnabledById(gsDriver.driver(), 'use', function (useLink) {
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
