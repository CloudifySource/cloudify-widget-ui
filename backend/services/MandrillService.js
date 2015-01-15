'use strict';
//https://mandrillapp.com/api/docs/index.nodejs.html
var logger = require('log4js').getLogger('MandrillService');

var mandrill = require('mandrill-api/mandrill');


/**
 *
 * @param data
 *
 * {
 *      apiKey : 'MANDRILL_API_KEY',
 *      template_name: 'templateName',
 *      template_content : [
 *          {
 *              'name' : 'link',
 *              'content' : '<a href="http://publicIP">Widget Name</a>'
 *          },
 *          {
 *              'name' : 'name',
 *              'content' : 'social login name'
 *          },
 *          {
 *              'name' : 'randomValue',
 *              'content' : 'RANDOM_VALUE'
 *          },
 *          {
 *              'name' : 'publicIp',
 *              'content' : 'publicIp'
 *          }
 *      ],
 *      message : {
 *          'to' : [
 *              'email' : 'email from social login',
 *              'name' : 'name from social login',
 *              'type' : 'to'
 *          ]
 *      },
 *      async: true
 *
 * }
 *
 *
 * @param callback
 */
exports.sendMandrillTemplate = function( data, callback ){

    if ( !callback ){
        callback = function(){}; //noop;
    }

    var mandrillClient = new mandrill.Mandrill(data.apiKey);
    delete data.apiKey;
    logger.debug('sending mandril details' , data);
    mandrillClient.messages.sendTemplate(data, function (result) {
        logger.info(result);
        callback(null, result);
        /*
         [{
         'email': 'recipient.email@example.com',
         'status': 'sent',
         'reject_reason': 'hard-bounce',
         '_id': 'abc123abc123abc123abc123abc123'
         }]
         */
    }, function (e) {

        // Mandrill returns the error as an object with name and message keys
        logger.error('mandrill error occurred: ' + e.name + ' - ' + e.message);
        callback(e);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
};
