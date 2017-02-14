'use strict';

/* Load modules */
const config = require('../');
const users = require('../../controllers/users');
const TwitterStrategy = require('passport-twitter').Strategy;

module.exports = new TwitterStrategy({
        consumerKey: config.twitter.consumer_key,
        consumerSecret: config.twitter.consumer_secret,
        callbackURL: config.twitter.callback
    },
    function(token, tokenSecret, profile, done) {
        process.nextTick(function () {
            console.log("INFO twitter user info:", profile);
            /* TODO: assign an email to the user */
            users.registerUser(
                    profile.displayName,
                    "",
                    profile.provider,
                    profile._json.profile_image_url,
                    profile._json.url, done
            );
        });
    }
);
