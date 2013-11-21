#!/bin/env node

/* Add libraries */
var express = require('express'),
	app = express(),
	jade = require('jade'),
	passport = require('passport'),
	auth = require("./config/authentication"),
	db = require("./config/database"),
	config = require("./config/config"),
	email = require("./config/email");

/* Set app properties */
app.set('title', "CodeBuddy");
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.cookieParser());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.session({ secret: "super-secret-u-will-never-guess" }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

app.get("/login", function(req, res) {
	var feed = {};
	feed.google_auth = config.google.auth;
	feed.twitter_auth = config.twitter.auth;
	feed.facebook_auth = config.facebook.auth;

	res.render("login.jade", {
    feed: feed
  });
});

app.get("/register", function(req, res) {
	res.redirect("/login");
});

app.post("/register", function(req, res) {
  // Save to db
  db.User.findOne({ email: req.body.email }, function (err, user) {
    if (err) console.log("ERROR", "error finding user:", err);
    else if (user) console.log("INFO", "email already exists:", req.body.email);
    if (err || user) return res.redirect("/login");
  });
  var user = new db.User({ name: req.body.name, email: req.body.email, password: auth.calculateHash("sha1", req.body.password) });
	user.verified = false;
	user.verification_hash = auth.calculateHash("sha1", user.email + Date());
	user.save(function(err) {
    if(err) console.log("ERROR", "error saving user:", err);
    else {
      console.log("INFO", "user saved:", user.email);
      email.sendRegistrationEmail(user.name, user.email, user.verification_hash);
      /*req.login(user, function(err) {
        if (err) console.log("ERROR", "logging in:", err);
        else return res.redirect("/");
      });*/
			return res.redirect("/");
    }
  });
});

app.get("/register/:id", function(req, res) {
	// add some logics to verify user email
	db.User.findOne({ verification_hash: req.params.id }, function (err, user) {
		if (err || !user) {
			console.log("ERROR", "error finding user:", err);
			return res.redirect("/login");
		}
  	user.verified = true;
  	user.save(function(err) {
	    if (err) {
	    	console.log("ERROR", "error verifing user:", err);
	    	return res.redirect("/login");
	    }
    	console.log("INFO", "user successfully verified:", user.email);
    	req.login(user, function(err) {
       	if (err) console.log("ERROR", "logging in:", err);
        else return res.redirect("/");
      });
	  });
	});
});

app.post("/login", passport.authenticate("local", { successRedirect: "/", failureRedirect: "/login" }));

app.get(config.google.auth, passport.authenticate("google", { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate("google", { successRedirect: "/", failureRedirect: "/login" }));

app.get(config.twitter.auth, passport.authenticate("twitter"));
app.get(config.twitter.callback, passport.authenticate("twitter", { successRedirect: "/", failureRedirect: "/login" }));

/* Known bug: Facebook callback appends #_=_ to the URL */
app.get(config.facebook.auth, passport.authenticate("facebook"));
app.get(config.facebook.callback, passport.authenticate("facebook", { successRedirect: "/", failureRedirect: "/login" }));

app.get("/logout", function(req, res) {
	req.logout();
	res.redirect("/login");
});

/* Homepage */
app.get("/", auth.ensureAuthenticated, function(req, res) {
	console.log("INFO", "user info in session:", req.user);
  /* Calculate gravatar hash */
  var gravatarHash = auth.calculateHash("md5", req.user.email);
  /* Define the mugshot source, profile name and profile url (google, facebook, gravatar) */
  var feed = {};
  feed.mugshot_src = req.user.mugshot || config.gravatar.mugshot + gravatarHash;
  feed.profile_name = req.user.name;
  feed.profile_url = req.user.link || config.gravatar.profile + gravatarHash;

  /* Render the response */
  res.render("index.jade", {
    feed: feed
  });
});

/* Profile page */
app.get("/profile", auth.ensureAuthenticated, function(req, res) {
	var feed = {};
	feed.name = req.user.name;
	feed.email = req.user.email;
	feed.mugshot_src = req.user.mugshot || config.gravatar.mugshot + auth.calculateHash("md5", req.user.email);
	feed.profile_name = req.user.name;
	feed.profile_url = req.user.link || config.gravatar.profile + auth.calculateHash("md5", req.user.email);
	/* Render the response */
  res.render("profile.jade", {
    feed: feed
  });
});

db.User.find(function (err, users) {
  if (err) console.log("ERROR", "fetching users:", err);
  else users.forEach(function(user) {
  	console.log("INFO", "user info:", user);
  });
});

/* Start the app */
app.listen(config.port, config.host);
console.log("INFO", "listening on port:", config.port);