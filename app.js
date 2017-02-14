'use strict';

/* Add modules */
const fs = require("fs");
const join = require("path").join;
const express = require('express');
const config = require('./app/config/');
const mongoose = require('mongoose');
const passport = require('passport');
const expressSession = require('express-session');
const mongoStore = require('connect-mongo')(expressSession);

/* Initialize express, the http server and socket.io server */
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

/* Create a session store using MongoDB */
var sessionStore = new mongoStore({
    autoReconnect: true,
    clear_interval: 60*60, /* hour */
    mongooseConnection: mongoose.connection
});

/* Expose */
module.exports = app;

/* Load database models */
var normalizedPath = join(__dirname, "app/models");
fs.readdirSync(normalizedPath).forEach(function(file) {
    require("./app/models/" + file);
});

/* Additional configuration */
require('./app/config/passport')(passport);
require('./app/config/share')(app, express, server);
require('./app/config/express')(app, passport, sessionStore);
require('./app/config/routes')(app, passport);
require('./app/config/socket')(app, passport, sessionStore, io);


/* Establish a connection to the database */
console.log("INFO connecting to database on:", config.database_url);
const options = { server: { socketOptions: { keepAlive: 1 } } };
mongoose.connect(config.database_url, options);
/* Register database connection events */
//mongoose.connection.on('disconnect', mongoose.connect(config.database_url, options));
mongoose.connection.on('error', console.log.bind(console, "ERROR database connection:"));
mongoose.connection.once('open', function() {
	/* Successfully connected to the database */
	console.log("INFO successfully connected to the database");
    /* Start the app */
    server.listen(config.port, config.ip, function() {
        console.log("INFO express server listening on ip:", config.ip, "port:", config.port);
    });
});
