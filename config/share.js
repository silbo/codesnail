'use strict';

/* Load modules */
const app = require('../app');
const config = require('./config');

/* sharejs */
const share = require('share');
const livedb = require('livedb');

const Duplex = require('stream').Duplex;
const browserChannel = require('browserchannel').server;

const backend = livedb.client(livedb.memory());
const sharejs = share.server.createClient({backend: backend});

/* Client libraries */
app.application.use(app.express.static(share.scriptsDir));

/* Streaming events */
app.application.use(browserChannel({webserver: app.application.server}, function(client) {

    /*  */
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
