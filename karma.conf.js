// Karma configuration

module.exports = function (config) {
    var configuration = {

        basePath: '',
        frameworks: ['jasmine'],
// list of files / patterns to load in the browser
        //   console.log(JASMINE, JASMINE_ADAPTER);
        files: [
            'app/bower_components/jquery/jquery.js',
            'app/bower_components/angular/angular.js',
            'app/bower_components/angular-cookies/angular-cookies.js',
            'app/bower_components/angular-route/angular-route.js',
            'app/bower_components/angular-sanitize/angular-sanitize.js',
            'app/bower_components/ngstorage/ngStorage.js',
            'app/bower_components/angular-resource/angular-resource.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/bower_components/gs-ui-infra/app/scripts/app.js',
            'app/bower_components/gs-ui-infra/app/scripts/filters/i18n.js',
            'app/bower_components/gs-ui-infra/app/scripts/services/i18next.js',
            'app/scripts/*.js',
            'app/scripts/**/*.js',
            'test/mock/**/*.js',
            'test/spec/**/*.js'
        ],

// list of files to exclude
        exclude: [],


        preprocessors: {
            'app/scripts/**/*.js': ['coverage']
        },

// test results reporter to use
// possible values: dots || progress || growl
        reporters: ['progress', 'coverage'],

// web server port
        port: 8080,

// cli runner port
        runnerPort: 9100,

// enable / disable colors in the output (reporters and logs)
        colors: true,

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,

// enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
        browsers: ['Chrome'],

// If browser does not capture in given timeout [ms], kill it
        captureTimeout: 30000,

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
        singleRun: false,

        coverageReporter: {
            type: 'html',
            dir: 'coverage/',
            subdir: function (browser) {
                var result = browser.toLowerCase().split(/[ /-]/)[0];
                console.log('this is browser', result);
                return result;
            }
        },

        plugins: [
            'karma-jasmine',
            'karma-coverage',
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-coverage',
            'karma-spec-reporter',
            'karma-junit-reporter'
        ]

    };

    config.set(configuration);

};


