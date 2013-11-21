/* Configuration, database and crypto */
var config = require("./config"),
  db = require("./database"),
  crypto = require('crypto');

/* OAuth stuff */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy;

/* Hashing function */
exports.calculateHash = function calculateHash(type, text) {
  var shasum = crypto.createHash(type);
  shasum.update(text);
  return shasum.digest("hex");
}

/* Simple route middleware to ensure user is authenticated. Otherwise send to login page. */
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

passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function () {
      /* So the user can also write the first part of the email, example@email.com can be also example */
      db.User.findOne({ email: new RegExp("(^" + username + "@|^" + username + "$)", "i") }, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false);
        if (user.password != exports.calculateHash("sha1", password)) return done(null, false);
        return done(null, user);
      });
    });
  }
));

passport.use(new GoogleStrategy({
    clientID: config.google.consumer_key,
    clientSecret: config.google.consumer_secret,
    callbackURL: config.google.callback
  },
  function(accessToken, refreshToken, profile, done) {
  	process.nextTick(function () {
      console.log("INFO", profile);
      var user = {};
      user.mugshot = profile._json.picture || profile._json.profile_image_url;
      user.name = profile.displayName || "Anonymous";
      user.link = profile._json.link || profile._json.url || profile.profileUrl;
      user.email = profile._json.email || "";
	    return done(null, user);
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
      console.log("INFO", profile);
      var user = {};
      user.mugshot = profile._json.picture || profile._json.profile_image_url;
      user.name = profile.displayName || "Anonymous";
      user.link = profile._json.link || profile._json.url || profile.profileUrl;
      user.email = profile._json.email || "";
	    return done(null, user);
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
      console.log("INFO", profile);
      var user = {};
      user.mugshot = profile._json.picture || profile._json.profile_image_url;
      user.name = profile.displayName || "Anonymous";
      user.link = profile._json.link || profile._json.url || profile.profileUrl;
      user.email = profile._json.email || "";
    	return done(null, user);
  	});
  }
));