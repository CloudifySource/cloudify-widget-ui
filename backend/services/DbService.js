'use strict';
//var logger = require('log4js').getLogger('DbManager');
var conf = require('../Conf');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var logger = require('log4js').getLogger('DbService');
//var format = require('util').format;


var dbConnection = null;


// cache the connection,
// according to the documentation, this is the preferred way
// http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connection-pooling
function getConnection(callback) {
    if (dbConnection !== null) {
        callback(null, dbConnection);
    } else {
        MongoClient.connect(conf.mongodbUrl, { 'auto_reconnect': true }, function (err, db) {
            dbConnection = db;
            callback(err, db);
        });
    }
}


exports.connect = function (collectionName, callback) {
    logger.trace('connecting', collectionName);
    getConnection(function (err, db) {
        if (err) {
            throw err;
        }

        var collection = db.collection(collectionName);
        callback(db, collection, function () {
        });
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