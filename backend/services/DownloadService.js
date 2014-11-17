'use strict';
var logger = require('log4js').getLogger('DownloadService');
//var fs = require('fs');
//var path = require('path');
var Download = require('download');
var files = require('./FilesService');

exports.downloadZipfile = function (options, callback) {
    try {
        var destDir = options.destDir,
            zipFileUrl = options.url,
            extract = options.extract;

        if (!destDir) {
            throw new Error('destination directory parameter is missing');
        }

        if (!zipFileUrl) {
            throw new Error('Zip file url parameter is missing');
        }

        logger.debug('making destination dir [' + destDir + ']');
        files.mkdirp(destDir);

        logger.debug('fetching zip from url [' + zipFileUrl + ']');

        var download = new Download({ extract: extract })
            .get(zipFileUrl)
            .dest(destDir);

        download.run(function (err, files, stream) {
            if (err) {
                logger.info('got error from download',err);
                callback(err);
            }

            callback && typeof callback === 'function' && callback(null);
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
            zipFileUrl: 'https://dl.dropboxusercontent.com/s/u51vae4947uto0u/biginsights_solo.zip?dl=1&token_hash=AAEi1Dx3f2AFvkYXRe3FgfpspkBkQCZLLaRJb7DYHe-y1w'
        };
        logger.info('start....');
        exports.downloadZipfile(params, function () {
            logger.info('finished...');
        });

    } catch (e) {
        logger.error('error while running downloadRecipe', e);
    }
}