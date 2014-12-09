/**

 class to help with functions for security group such as "get" and "validate"


 **/

var aws = require('aws-sdk');
var logger = require('log4js').getLogger('EC2.index');
var CidrUtils = require('../../CidrUtils');
var _ = require('lodash');
var Netmask = require('netmask').Netmask;


/**
 *
 * @param callback - function(err, result)
 *
 * Result looks like this :
 *
 *
 * {
 *  "OwnerId":"656379682496",
 *  "GroupName":"default",
 *  "GroupId":"sg-2e22154b",
 *  "Description":"default VPC security group",
 *  "IpPermissions":[
 *      {
 *          "IpProtocol":"-1",
 *          "UserIdGroupPairs":[],
 *          "IpRanges":[                              <=== This is what we care about mostly
 *              {"CidrIp":"0.0.0.0/0"}                <==== Note that when all ports are allowed, field is not here
 *          ]
 *      },
 *      {
 *          "IpProtocol":"tcp",
 *          "FromPort":80,
 *          "ToPort":80,                              <==== This is how it looks like if there are ports..
 *          "UserIdGroupPairs":[]
 *          "IpRanges":[
 *              {"CidrIp":"62.90.11.161/32"}
 *          ]
 *      }
 *  ],
 *  "IpPermissionsEgress":[
 *      {
 *          "IpProtocol":"-1",
 *          "UserIdGroupPairs":[],
 *          "IpRanges":[
 *              {
 *                  "CidrIp":"0.0.0.0/0"
 *              }
 *          ]
 *       }
 *  ]
 *  "VpcId":"vpc-3c57ee59",
 *  "Tags":[]
 *  }
 *
 *
 * @param details {
 *  apiKey:,
 *  secretKey:,
 *  region:,
 *  name
 *
 * }
 *
 *
 */
exports.get = function( details, callback ){
    var ec2 = new aws.EC2({
        'accessKeyId' : details.apiKey,
        'secretAccessKey' : details.secretKey,
        'region' : details.region
    });
    var name = details.name;
    var opts = {};
    if ( !!name ){

        opts.Filters = [
            {
                'Name' : 'group-name',
                'Values' : [name]
            }
        ]
    }

    logger.info('getting secuirty groups', JSON.stringify(opts));
    ec2.describeSecurityGroups(opts, function(err,result){
        if ( !!result && !!result.SecurityGroups && result.SecurityGroups.length > 0){ // remove the list. return only the first result.
            result = result.SecurityGroups[0];
        }
        if ( !!callback ) {
            callback(err, result);
        }
    });
};

function PortRange(from, to){

    // port can be number or string
    // if string can be port or port range
    this.isInRange = function( port ){
        var _from = port;
        var _to = port;
        if ( typeof(port) === 'string' ){
            if ( port.indexOf('-') > 0 ) {
                var args = port.split('-');
                _from = parseInt(args[0]);
                _to = parseInt(args[0]);
            }else{
                _from =_to = parseInt(port);
            }
        }

        return from <= _from && to >= _to;
    }
}

/**
 *
 *
 *
 * @param allowed {cidr} - ips security group defined as allowed
 * @param required {List<cidr / ipString>}- ips widget defined as required
 * @returns {boolean} - iff required range is within the allowed range
 */
exports.ipsInRange = function( allowed, required ){
    logger.debug('checking if ', required, 'is allowed by', allowed);
    for ( var i = 0; i < required.length; i++ ){
        var requiredIp = required[i];
        if ( requiredIp.indexOf('/') < 0){
            requiredIp = requiredIp + '/32';
        }

        var requiredBlock = CidrUtils.parse(requiredIp);
        requiredBlock = { 'first' : requiredBlock[0], 'last' : requiredBlock[1] };

        if ( !CidrUtils.isInRange(requiredBlock.first, allowed) || !CidrUtils.isInRange(requiredBlock.last, allowed) ){
            return false;
        }

    }
    return true;
};

/**
 *
 * A "stupid" algorithm for ip check. {@see isSiteGroupOpen}  for more details about "stupid" algorithms.
 *
 * We go over each cidr allowed by security group, and check if it contains all the ips required by the widget.
 * We disregard a combination of cidrs in the rule. That is because we are unsure it exists in AWS. The model suggests it does.
 *
 * @param allowed - range of ports allowed by security group
 * @param required - range of ports required by the widget
 * @returns {boolean} - iff range of required ports is contained in range of allowed ports.
 */
exports.portsInRange = function( allowed, required ){
    return new PortRange(allowed.from, allowed.to).isInRange(required);
};

function allIpsInRange( rule, requiredIps ){

    for ( var i = 0; i < rule.IpRanges.length ; i++ ) {
        if ( exports.ipsInRange(rule.IpRanges[i].CidrIp, requiredIps) ) {
            return true;
        }
    }

    return false;
}

/**
 *
 *
 * The algorithm is "stupid".
 * The reason it is stupid is that we are referring to a single range of IPs or ports at each given check.
 * While in reality, a collection of ranges is given, and the collection might be valid, while each single item is not.
 *
 * For example:
 *    ports allowed by security group [ 1,2,3 ]
 *    ports required [ 1-3 ]
 *
 *    None of the items answer the requirements, but together - they do..
 *    We ignore this scenario in this algorithm as we are unsure if such rules exist in AWS.
 *
 *
 * A "correct" algorithm would join all ranges first, and then run the test.
 *
 *
 *
 * @param securityGroup
 * @param requirements
 *
 * {
 *    "ips" : [ 'ip1', 'ip2', 'cidr1'],
 *    "ports" : [ 80, 0-10 ]
 *
 * }
 *
 *
 * @param callback
 */
exports.isSiteGroupOpen = function( securityGroup , requirements ){
    try {
        if (!securityGroup.IpPermissions) {
            return false;
        }

        var requiredIps = [].concat(requirements.ports); // clone

        // lets search for a rule that matches requirements
        _.each(securityGroup.IpPermissions, function (item) {

            var hasNoPorts = !item.FromPort && !item.ToPort; // if has no ports - than all ports.

            // if IP range applies on the required IPs.
            if (allIpsInRange(item, requirements.ips)) {
                // find which ports this supports, and remove them from required ports.
                requiredIps = _.reject(requiredIps, function (portRequired) {
                    return exports.portsInRange({ 'from': item.FromPort, 'to': item.ToPort }, portRequired) || hasNoPorts
                });
            }


        });

        // if requiredIps is empty, it means we found a rule for each port we require.
        return requiredIps.length === 0;
    }catch(e){
        logger.error('there was an error testing security group open', JSON.stringify(securityGroup,{},4) , 'requirements are', JSON.stringify(requirements,{},4));
    }
    return false; // default value


};



