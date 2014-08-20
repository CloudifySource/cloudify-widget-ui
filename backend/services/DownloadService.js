'use strict';
var logger = require('log4js').getLogger('DownloadService');
//var fs = require('fs');
//var path = require('path');
var download = require('download');
var files = require('./FilesService');

exports.downloadRecipe = function (options, callback) {
    try {
        var destDir = options.destDir,
            cloudifyRecipeUrl = options.recipeUrl;

        if (!destDir) {
            throw new Error('destination directory parameter is missing');
        }

        if (!cloudifyRecipeUrl) {
            throw new Error('Cloudify Recipe url parameter is missing');
        }

        logger.debug('making destination dir [' + destDir + ']');
        files.mkdirp(destDir);

        logger.debug('fetching zip from url [' + cloudifyRecipeUrl + ']');
        var dl = download(cloudifyRecipeUrl, destDir, { extract: true });
        dl.on('close', function () {
            callback && typeof callback === 'function' && callback(null);
        });
        dl.on('error', function(e){
            logger.info('got error from download',e);
            callback(e);
        });
    }catch(e){
        logger.error('error while downloading',e);
        callback(e);
    }
};

if (require.main === module) {

    logger.info('running main file, download recipe');
    try {
        var params = {
            destDir: 'downloaded',
            cloudifyRecipeUrl: 'https://dl.dropboxusercontent.com/s/u51vae4947uto0u/biginsights_solo.zip?dl=1&token_hash=AAEi1Dx3f2AFvkYXRe3FgfpspkBkQCZLLaRJb7DYHe-y1w'
        };
        logger.info('start....');
        exports.downloadRecipe(params, function () {
            logger.info('finished...');
        });

    } catch (e) {
        logger.error('error while running downloadRecipe', e);
    }
}