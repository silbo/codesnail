'use strict';

/* Load modules */
const config = require('../');
const users = require('../../app/controllers/users');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = new GitHubStrategy({
        clientID: config.github.consumer_key,
        clientSecret: config.github.consumer_secret,
        callbackURL: config.github.callback
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log("INFO github user info:", profile);
            users.registerUser(
                profile._json.name,
                profile._json.email,
                profile.provider,
                profile._json.avatar_url,
                profile._json.html_url,
                done
            );
        });
    }
);
