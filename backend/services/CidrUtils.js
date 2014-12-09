var rangeCheck = require('range_check');
/**
 *
 * This class helps us with CIDR and range check.
 *
 * I tried several plugins, but non has seemed to work or support the features we require.
 *
 */

//Parses a CIDR Range into beginning and ending IPv4 Addresses
//For example: '10.0.0.0/24'
//Returns     ['10.0.0.0', '10.0.0.255']
exports.parse = function(CIDR) {

    //Beginning IP address
    var beg = CIDR.substr(CIDR,CIDR.indexOf('/'));
    var end = beg;
    var off = (1<<(32-parseInt(CIDR.substr(CIDR.indexOf('/')+1))))-1;
    var sub = beg.split('.').map(function(a){return parseInt(a)});

    //An IPv4 address is just an UInt32...
    var buf = new ArrayBuffer(4); //4 octets
    var i32 = new Uint32Array(buf);

    //Get the UInt32, and add the bit difference
    i32[0]  = (sub[0]<<24) + (sub[1]<<16) + (sub[2]<<8) + (sub[3]) + off;

    //Recombine into an IPv4 string:
    end = Array.apply([],new Uint8Array(buf)).reverse().join('.');

    return [beg,end];
};

exports.isInRange = function( ip, cidr ){
    return rangeCheck.inRange(ip, cidr);
};