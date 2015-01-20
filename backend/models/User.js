'use strict';
/**
 * @module User
 * @description
 * represents a User model.
 *
 */
var AbstractModel = require('./AbstractModel');
var sha1 = require('sha1');


function User(data) {
    this.data = data;
}

User.collectionName = 'users';

User.encryptPassword = function( password ){
    return sha1(password);
};

AbstractModel.enhance(User);

module.exports = User;