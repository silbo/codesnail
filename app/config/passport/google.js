'use strict';

/* Load modules */
const config = require('../');
const users = require('../../controllers/users');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = new GoogleStrategy({
        clientID: config.google.consumer_key,
        clientSecret: config.google.consumer_secret,
        callbackURL: config.google.callback
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO google user info:", profile._json.urls);
            users.registerUser(
                profile.displayName,
                profile.emails[0].value,
                profile.provider,
                profile.photos[0].value,
                profile._json.url,
                done
            );
        });
    }
);
