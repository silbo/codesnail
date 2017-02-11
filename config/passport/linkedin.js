'use strict';

/* Load modules */
const config = require('../');
const users = require('../../app/controllers/users');
const LinkedInStrategy = require('passport-linkedin').Strategy;

module.exports = new LinkedInStrategy({
        consumerKey: config.linkedin.consumer_key,
        consumerSecret: config.linkedin.consumer_secret,
        callbackURL: config.linkedin.callback,
        profileFields: ['id', 'first-name', 'last-name', 'email-address', 'picture-url', 'public-profile-url']
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO linkedin user info:", profile);
            users.registerUser(
                profile.displayName,
                profile._json.emailAddress,
                profile.provider,
                profile._json.pictureUrl,
                profile._json.publicProfileUrl,
                done
            );
        });
    }
);
