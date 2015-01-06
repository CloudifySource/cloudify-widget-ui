/***
 * @class GsReadline
 *
 *
 * @description
 *
 * This class wraps ReadableStream and fires event for every line received.<br/>
 * Use it like so:
 *
 * <pre>
 *     var GsReadline = require('GsReadline');
 *     var readline = new GsReadline( someReadableStream );

        readline.on('lines', function( data ){
               logger.info('got lines', data );
        });
 * </pre>
 *
 * <h1> Events </h1>
 *
 * <h2>Event: 'lines'</h2>
 *
 * <code>function(lines)</code>
 * <div>
 * Emitted whenever we detect a newline character.
 * Array of lines accumulated so far.
 * </div>
 *
 */

var events = require('events');
var eol = require('os').EOL;
var util = require('util');
function GsReadline( stream ) {

    events.EventEmitter.call(this);
    var me = this;
    this.data = '';
    stream.on('data', function(data){
        me.handleData.apply(me, arguments);
    });

    this.finish = function finish(){
        this.emit('lines', this.data.split(eol));// todo: perhaps we should use some
    };

}

util.inherits(GsReadline, events.EventEmitter);

GsReadline.prototype.handleData = function(data) {
    this.data = this.data + data.toString();

    var lines = this.data.split(eol);

    if ( lines.length >  1 ){
        this.emit('lines', lines.splice(0,lines.length-1));
        this.data = lines[0];
    }
};


module.exports = GsReadline;



