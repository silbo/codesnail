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
	db = require("./config/database"),
	config = require("./config/config"),
	auth = require("./config/authentication"),
	MongoStore = require('connect-mongo')(express),
	expressValidator = require('express-validator');

var SessionStore = new MongoStore({ url: config.database_url });
/* Set app properties */
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
	secret: config.session_secret,
	store: SessionStore
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/* Login and registration */
app.all("/",function(req,res){
    res.render('index2',{});
})

app.all("/test",function(req,res){
    res.render('test',{});
})
/*
app.all("/login2",function(req,res){
    res.render('login2',{});
})*/
//app.get("/login2", auth.checkLogin, user.login);
app.get("/login", auth.checkLogin, user.login);
app.all("/register", auth.checkLogin, user.register);
app.get("/register/:id", auth.checkLogin, user.verify);
app.all("/forgot", auth.checkLogin, user.forgotPassword);

app.post("/login", passport.authenticate("local", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.google.auth, passport.authenticate("google", { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate("google", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.twitter.auth, passport.authenticate("twitter"));
app.get(config.twitter.callback, passport.authenticate("twitter", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

/* Facebook Oauth2 bug appends #_=_ to the callback URL */
app.get(config.facebook.auth, passport.authenticate("facebook", { scope: ['email'] }));
app.get(config.facebook.callback, passport.authenticate("facebook", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.linkedin.auth, passport.authenticate("linkedin", { scope: ['r_basicprofile', 'r_emailaddress'] }));
app.get(config.linkedin.callback, passport.authenticate("linkedin", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.github.auth, passport.authenticate("github"));
app.get(config.github.callback, passport.authenticate("github", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get("/logout", user.logout);

/* Different tabs */
app.get("/chat", routes.chat);
app.get("/study", routes.study);
app.all("/coding", routes.coding);
app.get("/sumorobot", routes.sumorobot);
app.get("/", auth.ensureAuthenticated, routes.index);

/* Profile pages */
app.get("/profile", auth.ensureAuthenticated, user.profile);
app.get("/:name", auth.ensureAuthenticated, user.detailed);
app.post("/profile/update", auth.ensureAuthenticated, user.profileUpdate);
app.post("/profile/password", auth.ensureAuthenticated, user.passwordUpdate);
app.get("/profile/remove/:name", auth.ensureAuthenticated, user.providerRemove);
app.get("/profile/mugshot/:provider", auth.ensureAuthenticated, user.mugshotUpdate);


/* Delete all the users and providers and tasks */
if (false) {
	db.User.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all users:", err);
		else console.log("INFO", "successfully removed all users");
	});
	db.Provider.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all providers:", err);
		else console.log("INFO", "successfully removed all providers");
	});
	db.Task.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all tasks:", err);
		else console.log("INFO", "successfully removed all tasks");
	});
}

/* Show all the users and providers and tasks */
db.User.find(function(err, users) {
	if (err) console.log("ERROR", "fetching all users:", err);
	else users.forEach(function(user) {
		console.log("INFO", "user name:", user.name);
	});
});
db.Provider.find(function(err, providers) {
	if (err) console.log("ERROR", "fetching all providers:", err);
	else providers.forEach(function(provider) {
		console.log("INFO", "provider url:", provider.url);
	});
});
db.Task.find(function(err, tasks) {
	if (err) console.log("ERROR", "fetching all tasks:", err);
	else tasks.forEach(function(task) {
		console.log("INFO", "task:", task.name);
	});
});

/* Start the app and sockets */
var server = http.createServer(app).listen(config.port, function() {
	console.log("INFO", "express server listening on port:", config.port);
	var socket = require("./config/socket");
});

/* Export items for other modules */
exports.server = server;
exports.SessionStore = SessionStore;