'use strict';

var _ = require('lodash');
var logger = require('log4js').getLogger('ErrorResponseService');

/**
 *
 * @param code our logical code. some kind of an ID to identify the problem.
 * @param responseCode http response code
 * @param message some generic message for this error.
 * @constructor
 */
function Error( responseCode, code, message  ){
    var data = { code : code, responseCode : responseCode, message: message };


    /**
     *
     * @param err the cause if exists
     * @param description some more descriptive reason why we got this error
     * @param extra extra parameters we might want to add but did not think about when wrote this class
     */
    function SendError( err, description, extra ){
        if ( !!err ){
            data.error = err;
        }

        if ( !!description ){
            data.description = description;
        }

        if ( !!extra ){
            try {
                _.merge(data, extra);
            }catch(e){
                logger.error('unable to merge extra',e);
            }
        }
        this.send = function( res ){
            res.status(responseCode).send(data);
            return;
        };
    }

    return SendError;

}


exports.InvalidRequest = new Error(400, 1, 'invalid request');
exports.InternalError = new Error(500, 2, 'internal error');
exports.NotFound     = new Error(404, 3, 'not found');
exports.Unauthorized     = new Error(401, 4, 'unauthorized');

