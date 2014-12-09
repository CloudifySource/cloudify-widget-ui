'use strict';

var logger = require('log4js').getLogger('testEc2SecurityGroup');

describe('ec2.securityGroup', function(){

    var aws = require('aws-sdk');

    // mock
    aws.reset = function(){
        aws.describedSecurityGroupsInvoked = null;
        aws.ec2ClientInvoked = null;
    };
    var dataToReturn =   { 'SecurityGroups' : ['first','second'] };
    var errorToReturn = null;
    aws.EC2 = function(){
//        logger.info('creating EC2', arguments);
        aws.ec2ClientInvoked = arguments;
        this.describeSecurityGroups = function( filter, callback ){
//            logger.info('describing security groups', arguments);
            aws.describeSecurityGroupsInvoked = arguments;
            if ( !!callback ){
                callback(errorToReturn,dataToReturn);
            }
        }
    };

    var SecurityGroup = require('../../backend/services/clouds/ec2/SecurityGroup');

    describe('get', function(){


        it('should create a new ec2 client', function(){
            SecurityGroup.get({ 'name' : 'a_name', 'apiKey' : 'the api key', 'secretKey' : 'the secret key', 'region' : 'the region' });
            expect(aws.ec2ClientInvoked[0]).toEqual({ 'accessKeyId' : 'the api key', 'secretAccessKey' : 'the secret key', 'region' : 'the region' });

        });

        it ('should get security group from ec2 with group name as filter', function(){
            var type = typeof(aws.describeSecurityGroupsInvoked[1]);
            expect(type).toBe('function');
            var filter = aws.describeSecurityGroupsInvoked[0];
            expect(filter.hasOwnProperty('Filters')).toBe(true);
            expect(filter.Filters[0].Name).toBe('group-name');
            expect(filter.Filters[0].Values[0]).toBe('a_name');

        });

        it('should get all security groups from ec2', function(){
            aws.reset();
            SecurityGroup.get({});
            var filter = aws.describeSecurityGroupsInvoked[0];
            expect(filter).toEqual({});
        });

        it('should return the first security group found in result', function(){
            SecurityGroup.get({}, function(err, result){
                expect(result).toEqual('first');
            });
        });

        it('should return result as is if data does not exist', function(){
            dataToReturn = { 'name' : 'some random object' };
            SecurityGroup.get({}, function(err, result){
                expect(result).toEqual(dataToReturn);
                expect(err).toEqual(null);
            });
        });

        it('should pass error as it recieved it', function(){
            errorToReturn = 'this is an error';
            SecurityGroup.get({}, function(err){
                expect(err).toEqual('this is an error');
            });
        })
    });

    describe('portsInRange', function () {
        it('should return true if required port in allowed ports range', function () {
            expect(SecurityGroup.portsInRange({'from' : 90, 'to' : 95}, 93)).toBe(true);
        });

        it('should return false otherwise', function () {
            expect(SecurityGroup.portsInRange({'from' : 90, 'to' : 95}, 89)).toBe(false);
        });

        it('should support ipRange syntax', function(){
            expect(SecurityGroup.portsInRange({'from' : 90, 'to' : 95}, '93-94')).toBe(true);
            expect(SecurityGroup.portsInRange({'from' : 90, 'to' : 95}, '89-94')).toBe(false);
        });

        it('should support string', function(){
            expect(SecurityGroup.portsInRange({'from' : 90, 'to' : 95},'90')).toBe(true);
        });
    });

    describe('ipsInRange', function(){
       it('should return true if required ips in allowed ips', function(){
           expect(SecurityGroup.ipsInRange('1.1.1.1/0', ['255.255.255.200'])).toBe(true);
       });
        it('should return false otherwise', function(){
            expect(SecurityGroup.ipsInRange('1.1.1.1/32', ['255.255.255.200/0'])).toBe(false);
        });

        it('should support list of required IPs', function(){
            expect(SecurityGroup.ipsInRange('1.1.1.1/32', ['1.1.1.1'])).toBe(true);
            expect(SecurityGroup.ipsInRange('1.1.1.1/32', ['1.1.1.1','1.1.1.2'])).toBe(false);
            expect(SecurityGroup.ipsInRange('1.1.1.1/30', ['1.1.1.1','1.1.1.2'])).toBe(true);
        });
    });

    describe('isSiteGroupOpen', function(){

        var allowed = {
            'IpPermissions': [
                {
                    'IpProtocol': '-1',
                    'UserIdGroupPairs': [],
                    'IpRanges': [
                        {'CidrIp': '0.0.0.0/0'}
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'UserIdGroupPairs': [],
                    'IpRanges': [
                        {'CidrIp': '62.90.11.161/32'}
                    ]
                }
            ]

        };

        var limitedAllowed = {
            'IpPermissions': [
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'UserIdGroupPairs': [],
                    'IpRanges': [
                        {'CidrIp': '62.90.11.161/32'}
                    ]
                }
            ]

        };

        var required = {
            'ports' : [90, '100-120'],
            'ips' : ['1.1.1.1/32', '2.2.2.2/3']
        };

        var limitedRequired = {
            'ports' : [80],
            'ips' : ['62.90.11.161']
        };

       it('should return true if group allows required demands', function(){
            expect(SecurityGroup.isSiteGroupOpen( allowed, required )).toBe(true);
            expect(SecurityGroup.isSiteGroupOpen( limitedAllowed, limitedRequired )).toBe(true);
       });

        it('should return false otherwise', function(){
            expect(SecurityGroup.isSiteGroupOpen( limitedAllowed, required )).toBe(false);
        });

        it('should return false if security group does not have required data on it', function(){
            expect(SecurityGroup.isSiteGroupOpen({}, required)).toBe(false);
        });

        it('should handle exceptions', function(){
            var CidrUtils = require('../../backend/services/CidrUtils');
            spyOn(CidrUtils,'parse').andCallFake(function(){
                throw new Error('this is an error');
            });

            expect(SecurityGroup.isSiteGroupOpen(allowed, required)).toBe(false);

        });


    });


});