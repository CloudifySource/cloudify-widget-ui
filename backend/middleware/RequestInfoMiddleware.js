'use strict';
/**
 *
 * This file adds middleware code to put more info on request if necessary.
 * For example - we might want to put some configuration on request.
 *
 *
 */

//var logger = require('log4js').getLogger('RequestInfoMiddleware');

exports.origin = function( req, res, next){
    var _origin = req.protocol + '://' +req.get('Host')  ;
    req.origin = _origin;

    // expects a URL from root '/some/page' which will result in 'protocol://host:port/some/page'
    req.absoluteUrl = function( relativeUrl ){
        return _origin + relativeUrl;
    };
    next();
};
