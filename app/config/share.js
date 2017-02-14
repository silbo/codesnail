'use strict';

/* Load modules */
const config = require('./');

/* ShareJS */
var livedb = require('livedb');
var sharejs = require('share');

var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server

var backend = livedb.client(livedb.memory());
var share = sharejs.server.createClient({backend: backend});

module.exports = function(app, express, server) {

    /* Share client library */
    app.use(express.static(sharejs.scriptsDir));

    app.use(browserChannel({webserver: server}, function(client) {
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

      // Give the stream to sharejs
      return share.listen(stream);
    }));
};
