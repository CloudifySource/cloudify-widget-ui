'use strict';
var dbManager = require('./DbManager');

exports.updateUser = function( user , callback ){
    dbManager.connect('users', function( db, collection, done){
        collection.update( {'_id' : user._id }, user, function( err ){
            done();
            callback( err );
            return;
        });
    });
};

exports.getAll = function( filter, callback ){
    dbManager.connect('users', function(db, collection, done){
        collection.find(filter).toArray(function(err, result){
            if (!!err ){
                done();
                callback(err);
                return;
            }

            done();
            callback(result);
            return;
        });

    });
};