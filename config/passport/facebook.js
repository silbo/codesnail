'use strict';

/* Load modules */
const config = require('../');
const users = require('../../app/controllers/users');
const FacebookStrategy = require('passport-facebook').Strategy;

module.exports = new FacebookStrategy({
        clientID: config.facebook.consumer_key,
        clientSecret: config.facebook.consumer_secret,
        callbackURL: config.facebook.callback,
        profileFields: ['emails', 'displayName', 'photos', 'profileUrl']
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO", "facebook user info:", profile);
            users.registerUser(
                profile._json.name,
                profile._json.email,
                profile.provider,
                profile._json.picture.data.url,
                profile._json.link,
                done
            );
        });
    }
);
