#!/bin/env node

/* Add modules */
var express = require('express'),
	expressValidator = require('express-validator'),
	app = express(),
	jade = require('jade'),
	passport = require('passport'),
	auth = require("./config/authentication"),
	db = require("./config/database"),
	config = require("./config/config"),
	email = require("./config/email"),
	routes = require('./routes'),
	user = require('./routes/user');

/* Set app properties */
app.set('title', "CodeBuddy");
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: "super-secret-u-will-never-guess" }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

app.get("/login", user.login);
app.get("/register", user.register);
app.post("/register", user.register);
app.get("/register/:id", user.verify);

app.post("/login", passport.authenticate("local", { successRedirect: "/", failureRedirect: "/login", failureMessage: "Invalid username or password" }));

app.get(config.google.auth, passport.authenticate("google", { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate("google", { successRedirect: "/", failureRedirect: "/login" }));

app.get(config.twitter.auth, passport.authenticate("twitter"));
app.get(config.twitter.callback, passport.authenticate("twitter", { successRedirect: "/", failureRedirect: "/login" }));

/* Known bug: Facebook callback appends #_=_ to the URL */
app.get(config.facebook.auth, passport.authenticate("facebook", { scope: ['email'] }));
app.get(config.facebook.callback, passport.authenticate("facebook", { successRedirect: "/", failureRedirect: "/login" }));

app.get("/logout", user.logout);

/* Homepage */
app.get("/", auth.ensureAuthenticated, routes.index);

/* Profile page */
app.get("/profile", auth.ensureAuthenticated, user.profile);

if (true) {
	db.User.remove(function (err, users) {
	  if (err) console.log("ERROR", "fetching users:", err);
	  else console.log("INFO", "successfully removed all users");
	});
}

db.User.find(function (err, users) {
  if (err) console.log("ERROR", "fetching users:", err);
  else users.forEach(function(user) {
  	console.log("INFO", "user info:", user);
  });
});

/* Start the app */
app.listen(config.port, config.host);
console.log("INFO", "listening on port:", config.port);