'use strict';

/* Load modules */
const mongoose = require('mongoose');
const local = require('./passport/local');
const github = require('./passport/github');
const google = require('./passport/google');
const twitter = require('./passport/twitter');
const facebook = require('./passport/facebook');
const linkedin = require('./passport/linkedin');

/* Load database models */
const User = mongoose.model('User');

/* Expose */
module.exports = function(passport) {

    /* Serialize session */
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    /* Deserialize sessin */
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    /* Athentication strategies */
    passport.use(local);
    passport.use(github);
    passport.use(google);
    passport.use(twitter);
    passport.use(facebook);
    passport.use(linkedin);
};
