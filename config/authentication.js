/* Configuration, database and crypto */
var db = require("./database"),
    crypto = require('crypto'),
    config = require("./config"),
    flash = require('connect-flash');

/* OAuth stuff */
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
    LinkedInStrategy = require('passport-linkedin').Strategy,
    GitHubStrategy = require('passport-github').Strategy;

/* Hashing function */
exports.calculateHash = function calculateHash(type, text) {
    var shasum = crypto.createHash(type);
    shasum.update(text);
    return shasum.digest("hex");
}

/* Random function */
exports.generateRandom = function generateRandom() {
    var current_date = (new Date()).valueOf().toString();
    var random = parseInt(Math.random().toString()*100);
    return random;
}

/* Generate a random guest account */
exports.generateGuest = function generateGuest() {
    var random = exports.generateRandom();
    var randomEmailHash = exports.calculateHash('md5', random + "@email.com");
    var user = {
        name: "Guest" + random,
        guest: true,
        profile: {
            mugshot: "http://www.gravatar.com/avatar/" + randomEmailHash + "?d=identicon",
            website: "http://www.gravatar.com/",
            description: "",
            points: 0
        }
    };
    console.log("INFO", "generated guest user:", user);
    return user;
}

/* Simple route middleware to ensure user is authenticated. Otherwise send to login page. */
exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

/* Signup for a user */
var registerUser = function registerUser(name, email, provider_name, mugshot, link, done) {
    /* Find user by email */
    db.User.findOne({ email: email }).populate('profile.providers').exec(function (err, user) {
        if (err) return done(err);
        /* When the user with the email was found and the provider is registered */
        else if (user && user.profile.providers.map(function(elem) { return elem.name; }).join(",").indexOf(provider_name) > -1) return done(null, user);

        /* Register a new provider */
        var provider = new db.Provider({ name: provider_name, mugshot: mugshot, display_name: name, url: link });
        provider.save();
        /* When no user under this email was found */
        if (!user) {
            var user = new db.User({ name: name, email: email });
            user.profile.mugshot = mugshot;
            user.profile.website = link;
        }
        /* Register this provider for the user */
        user.profile.providers.push(provider);
        user.save(function(err) {
            if (err) console.log("ERROR", "error saving user:", err);
            else {
                console.log("INFO", "user saved:", user.email);
                /* Fetch the information again, for the new provider information */
                db.User.findOne({ email: email }).populate('profile.providers').exec(function (err, user) {
                    return done(null, user);
                });
            }
        });
    });
};

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        process.nextTick(function () {
            /* Escape some characters before using regular expression matching */
            db.User.findOne({ email: username }).populate('profile.providers').exec(function (err, user) {
                if (err) return done(err);
                if (!user) return done(null, false, { message: "Wrong username or password" });
                if (user.password != exports.calculateHash("sha256", password + user.joined_date)) 
                    return done(null, false, { message: "Wrong username or password" });
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
            console.log("INFO", "google user info:", profile);
            registerUser(profile._json.name, profile._json.email, profile.provider, profile._json.picture, profile._json.link, done);
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
            console.log("INFO", "twitter user info:", profile);
            db.User.findOne({ name: new RegExp("^" + profile.displayName, "i") }).populate('profile.providers').exec(function (err, user) {
                if (err) done(err);
                /* No user with this display name was found */
                else if (!user) done(null, false, { message: "Twitter username must match your profiles: " + profile.displayName });
                /* The user was found */
                else registerUser(user.name, user.email, profile.provider, profile._json.profile_image_url, profile._json.url, done);
            });
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
            console.log("INFO", "facebook user info:", profile);
            registerUser(profile._json.name, profile._json.email, profile.provider, profile._json.picture.data.url, profile._json.link, done);
        });
    }
));

passport.use(new LinkedInStrategy({
        consumerKey: config.linkedin.consumer_key,
        consumerSecret: config.linkedin.consumer_secret,
        callbackURL: config.linkedin.callback,
        profileFields: ['id', 'first-name', 'last-name', 'email-address', 'picture-url', 'public-profile-url']
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO", "linkedin user info:", profile);
            registerUser(profile.displayName, profile._json.emailAddress, profile.provider, profile._json.pictureUrl, profile._json.publicProfileUrl, done);
        });
    }
));

passport.use(new GitHubStrategy({
        clientID: config.github.consumer_key,
        clientSecret: config.github.consumer_secret,
        callbackURL: config.github.callback
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO", "github user info:", profile);
            registerUser(profile._json.name, profile._json.email, profile.provider, profile._json.avatar_url, profile._json.html_url, done);
        });
    }
));