/* Configuration stuff */
var config = require("./config");

/* OAuth stuff */
var passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy;

// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: config.google.consumer_key,
    clientSecret: config.google.consumer_secret,
    callbackURL: config.google.callback
  },
  function(accessToken, refreshToken, profile, done) {
  	process.nextTick(function () {
	    return done(null, profile);
	  });
  }
));

passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumer_key,
    consumerSecret: config.twitter.consumer_secret,
    callbackURL: config.twitter.callback
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {
	    return done(null, profile);
	  });
  }
));

passport.use(new FacebookStrategy({
    clientID: config.facebook.consumer_key,
    clientSecret: config.facebook.consumer_secret,
    callbackURL: config.facebook.callback
  },
  function(accessToken, refreshToken, profile, done) {
  	process.nextTick(function () {
    	return done(null, profile);
  	});
  }
));