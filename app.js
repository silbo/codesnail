#!/bin/env node

/* Add modules */
var express = require('express'),
    app = express(),
    fs = require('fs'),
    http = require('http'),
    jade = require('jade'),
    routes = require('./routes'),
    passport = require('passport'),
    user = require('./routes/user'),
    flash = require('connect-flash'),
    db = require('./config/database'),
    config = require('./config/config'),
    emailing = require('./config/email'),
    session = require('express-session'),
    auth = require('./config/authentication'),
    MongoStore = require('connect-mongo')(session),
    expressValidator = require('express-validator');

/* Create a session store that is connected to the users */
var SessionStore = new MongoStore({ url: config.database_url, autoReconnect: true });
/* Set app properties */
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(expressValidator());
app.use(session({
    resave: true,
    store: SessionStore,
    saveUninitialized: true,
    secret: config.session_secret,
    cookie: { maxAge : 3600000 * 24 * 3 }, // 3 days
}));
app.use(flash());
/* Set the view variables */
app.use(function(req, res, next) {
  res.locals.error = req.flash('error');
  res.locals.email = req.flash('email');
  res.locals.message = req.flash('message');
  res.locals.username = req.flash('username');
  next();
});
app.use(passport.initialize());
app.use(passport.session());

/* Error handling */
app.use(function(err, req, res, next) {
    /* Check error information and respond accordingly */
    console.log("ERROR", "app error:", err);
    res.sendfile(__dirname + '/public/html/error.html');
    /* Send the error report to the admin */
    emailing.sendErrorReport(config.admin_name, config.admin_email, err);
});

/* Landingpage */
app.get('/', routes.index);

/* Login and registration */
app.get('/login', auth.checkLogin, user.login);
app.all('/signup', auth.checkLogin, user.signup);
app.get('/signup/:id', auth.checkLogin, user.verify);
app.all('/forgot', auth.checkLogin, user.forgotPassword);

app.post('/login', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

app.get(config.google.auth, passport.authenticate('google', { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate('google', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

app.get(config.twitter.auth, passport.authenticate('twitter'));
app.get(config.twitter.callback, passport.authenticate('twitter', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

/* Facebook Oauth2 bug appends #_=_ to the callback URL */
app.get(config.facebook.auth, passport.authenticate('facebook', { scope: ['email'] }));
app.get(config.facebook.callback, passport.authenticate('facebook', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

app.get(config.linkedin.auth, passport.authenticate('linkedin', { scope: ['r_basicprofile', 'r_emailaddress'] }));
app.get(config.linkedin.callback, passport.authenticate('linkedin', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

app.get(config.github.auth, passport.authenticate('github'));
app.get(config.github.callback, passport.authenticate('github', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

app.get('/logout', user.logout);

/* Different tabs */
app.get('/chat', routes.chat);
app.get('/study', routes.study);
app.all('/coding', routes.coding);
app.get('/sumorobot', routes.sumorobot);
app.get('/ninjasinthebox', routes.ninjasinthebox);
app.get('/lucy', routes.lucy);
app.get('/coddee', routes.coddee);
app.get('/dashboard', auth.ensureAuthenticated, routes.dashboard);

/* Profile pages */
app.get('/profile', auth.ensureAuthenticated, user.profile);
app.get('/profile/:name', auth.ensureAuthenticated, user.detailed);
app.post('/profile/update', auth.ensureAuthenticated, user.profileUpdate);
app.post('/profile/password', auth.ensureAuthenticated, user.passwordUpdate);
app.get('/profile/remove/:name', auth.ensureAuthenticated, user.providerRemove);
app.get('/profile/mugshot/:provider', auth.ensureAuthenticated, user.mugshotUpdate);

/* Show all the users and providers and tasks */
db.User.find(function(err, users) {
    if (err) return new Error(err);
    else users.forEach(function(user) {
        console.log("INFO", "user name:", user.name);
    });
});
db.Provider.find(function(err, providers) {
    if (err) return new Error(err);
    else providers.forEach(function(provider) {
        console.log("INFO", "provider url:", provider.url);
    });
});
db.Task.find(function(err, tasks) {
    if (err) return new Error(err);
    else tasks.forEach(function(task) {
        console.log("INFO", "task:", task.name);
    });
});

/* Start the app and sockets */
var server = http.createServer(app).listen(config.port, function() {
    console.log("INFO", "express server listening on port:", config.port);
    var socket = require('./config/socket');
});

/* sharejs */
var share = require('share');
var livedb = require('livedb');
var Duplex = require('stream').Duplex;
var browserChannel = require('browserchannel').server;

var livedbmongo = require('livedb-mongo');
var mongo = livedbmongo(config.database_url, {safe:true});

var sharejs = share.server.createClient({ backend: livedb.client(mongo) });
/* client libraries */
app.use(express.static(share.scriptsDir));
/* streaming events */
app.use(browserChannel({webserver: app.server}, function(client) {
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

/* Export items for other modules */
exports.server = server;
exports.SessionStore = SessionStore;