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
      db.User.findOne({ email: new RegExp("(^" + username + "@|^" + username + "$)", "i") }).populate('profile.providers').exec(function (err, user) {
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
      //console.log("INFO", "google user info:", accessToken);
      db.User.findOne({ email: profile._json.email }).populate('profile.providers').exec(function (err, user) {
        if (err) return done(err);
        /* When the user was found and the provider is registered */
        else if (user && user.profile.providers.map(function(elem) { return elem.name; }).join(",").indexOf(profile.provider) > -1) return done(null, user);

        var provider = new db.Provider({ name: profile.provider, mugshot: profile._json.picture, display_name: profile._json.name, url: profile._json.link });
        provider.save(function(err) {
          if (err) console.log("ERROR", "error saving provider:", err);
          else console.log("INFO", "provider saved:", provider.name);
        });
        var user = new db.User({ name: profile._json.name, email: profile._json.email });
        user.profile.mugshot = profile._json.picture;
        user.profile.website = profile._json.link;
        user.profile.providers.push(provider);
        user.save(function(err) {
          if (err) console.log("ERROR", "error saving user:", err);
          else {
            console.log("INFO", "user saved:", user.email);
            db.User.findOne({ email: profile._json.email }).populate('profile.providers').exec(function (err, user) {
              return done(null, user);
            });
          }
        });
      });
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
      user.mugshot = profile._json.profile_image_url;
      user.name = profile.displayName;
      user.website = profile._json.url;
      user.profile = profile;
	    return done(null, user);
	  });
  }
));

passport.use(new FacebookStrategy({
    clientID: config.facebook.consumer_key,
    clientSecret: config.facebook.consumer_secret,
    callbackURL: config.facebook.callback,
    profileFields: ['emails', 'displayName', 'photos', 'profileUrl']
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //console.log("INFO", "facebook user info:", profile);
      db.User.findOne({ email: profile._json.email }).populate('profile.providers').exec(function (err, user) {
        if (err) return done(null, false);
        /* When the user was found and the provider is registered */
        else if (user && user.profile.providers.map(function(elem) { return elem.name; }).join(",").indexOf(profile.provider) > -1) return done(null, user);

        var provider = new db.Provider({ name: profile.provider, mugshot: profile._json.picture, display_name: profile._json.name, url: profile._json.link });
        provider.save(function(err) {
          if (err) console.log("ERROR", "error saving provider:", err);
          else console.log("INFO", "provider saved:", provider.name);
        });
        var user = new db.User({ name: profile._json.name, email: profile._json.email });
        user.profile.mugshot = profile._json.picture.data.url;
        user.profile.website = profile._json.link;
        user.profile.providers.push(provider);
        user.save(function(err) {
          if (err) console.log("ERROR", "error saving user:", err);
          else {
            console.log("INFO", "user saved:", user.email);
            return done(null, user);
          }
        });
      });
    });
  }
));