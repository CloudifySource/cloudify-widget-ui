'use strict';


/**
 * @module DbManager
 * @description
 *
 *
 * use this manager
 *
 * <pre>
 *     var dbManager = require('...path...');
 *     dbManager.connect('collectionName', function(db, collection){
 *
 *           .. use collection as defined in node-mongo documentation
 *           https://github.com/mongodb/node-mongodb-native
 *           http://mongodb.github.io/node-mongodb-native/markdown-docs/queries.html
 *
 *           no need to disconnect, or such. just do what you need with the collection.
 *
 *     });
 *</pre>
 *
 *
 * @type {exports}
 */

var logger = require('log4js').getLogger('DbManager');
var conf = require('../Conf');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
//var format = require('util').format;


var dbConnection = null;


// cache the connection,
// according to the documentation, this is the preferred way
// http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connection-pooling
function getConnection(callback) {

    if (dbConnection !== null) {
        callback(null, dbConnection);
    } else {
        logger.trace('connecting', conf.mongodbUrl);
        MongoClient.connect(conf.mongodbUrl, { 'auto_reconnect': true }, function (err, db) {
            dbConnection = db;
            callback(err, db);
        });
    }
}


exports.connect = function (collectionName, callback) {
    logger.trace('connecting to ',  collectionName);
    getConnection(function (err, db) {
        logger.trace('got connection', err );
        if (err) {
            throw err;
        }

        var collection = db.collection(collectionName);
        callback(db, collection, function () {
//            db.close();
//            closed = true;
        });
//        if (!closed) {
//            logger.warn('connection was not closed by callback');
//            we just want to warn at the moment, not actually close it.
//            for some reason, closing the connection here will break functionality
//        }
    });
};

exports.toObjectId = function (id) {
    if (id instanceof ObjectID) {
        return id;
    }
    if (typeof id === 'string') { // this is a hex string
        return ObjectID.createFromHexString(id);
    }
    throw new Error('unable to parse ObjectID from id [' + id + ']');
};

exports.id = function (id) {
    return exports.toObjectId(id);
};
