#!/bin/env node

/* Add libraries */
var express = require('express'),
	app = express(),
	passport = require('passport'),
	auth = require("./config/authentication"),
	db = require("./config/database"),
	config = require("./config/config"),
	crypto = require('crypto');

/* Set app properties */
app.set('title', "CodeBuddy");
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
	feed['google_auth'] = config.google.auth;
	feed['twitter_auth'] = config.twitter.auth;
	feed['facebook_auth'] = config.facebook.auth;

	res.render("login.ejs", {
    locals: { feed: feed }
  });
});

app.post("/register", function(req, res) {
  // Attach POST to user schema
  var user = new User({ email: req.body.email, password: req.body.password, name: req.body.name });
  // Save in db
  user.save(function(err) {
    if(err) console.log(err);
    else {
      console.log("INFO", "user saved:", user.email);
      req.login(user, function(err) {
        if (err) console.log(err);
        return res.redirect('/');
      });
    }
  });
});

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
app.get('/', auth.ensureAuthenticated, function(req, res) {
	console.log("INFO", "user info in session:", req.user);
  /* Calculate gravatar hash */
  var gravatarHash = "";
	if (typeof req.user.emails !== "undefined") {
		var shasum = crypto.createHash("md5");
			shasum.update(req.user.emails[0].value);
			gravatarHash = shasum.digest("hex");
  }
  /* Define the mugshot source, profile name and profile url (google, facebook, gravatar) */
  var feed = {};
  feed['mugshot_src'] = req.user._json.picture || req.user._json.profile_image_url || config.gravatar.mugshot + gravatarHash;
  feed['profile_name'] = req.user.displayName || "Anonymous";
  feed['profile_url'] = req.user.profileUrl || req.user._json.link || req.user._json.url || config.gravatar.profile + gravatarHash;

  /* Render the response */
  res.render("main.ejs", {
    locals: { feed: feed }
  });
});

/* Start the app */
app.listen(config.port, config.host);
console.log("INFO", "Listening on port:", config.port);