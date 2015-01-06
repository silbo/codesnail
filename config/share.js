var app = require('../app'),
    config = require('./config');
/* sharejs */
var share = require('share');
var livedb = require('livedb');
var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server;

var livedbmongo = require('livedb-mongo');
var mongo = livedbmongo(config.database_url, {safe:true});

var sharejs = share.server.createClient({ backend: livedb.client(mongo) });
/* client libraries */
app.application.use(app.express.static(share.scriptsDir));
/* streaming events */
app.application.use(browserChannel({webserver: app.application.server}, function(client) {
    var stream = new Duplex({objectMode: true});

    stream._read = function() {};
    stream._write = function(chunk, encoding, callback) {
        if (client.state !== 'closed') {
            client.send(chunk);
        }
        callback();
    };

    client.on('message', function(data) {
        stream.push(data);
    });

    client.on('close', function(reason) {
        stream.push(null);
        stream.emit('close');
    });

    stream.on('end', function() {
        client.close();
    });

    /* Give the stream to sharejs */
    return sharejs.listen(stream);
}));