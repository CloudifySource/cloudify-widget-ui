/**
 * Created by sefi on 30/11/14.
 */
'use strict';

var logger = require('log4js').getLogger('index');
var ec2Service = require('../backend/services/clouds/ec2');
var conf = require('../backend/Conf');

ec2Service.securityGroup.get( conf.aws, function(err, result){
    if ( !!result ) {
        logger.info(JSON.stringify(result, {}, 4));
    }else{
        logger.info(arguments);
    }
});