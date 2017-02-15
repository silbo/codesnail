'use strict';

/* Load modules */
const config = require('../');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;

/* Load database models */
const User = mongoose.model("User");

module.exports = new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    function(username, password, done) {
        process.nextTick(function () {
            /* Apply some filters on the username */
            var filteredUsername = username.toLowerCase().replace(" ", "");

            /* Find the user (entered username is either a email or the username of the user) */
            User.findOne({ $or:[{ username: filteredUsername }, { email: filteredUsername }] }).populate('profile.providers').exec(function (err, user) {
                if (err) return done(err);
                else if (!user) return done(null, false, { message: "Wrong username or password" });
                else if (user.password != utils.calculateHash("sha256", password + user.profile.joined_date))
                    return done(null, false, { message: "Wrong username or password" });
                else if (user.verification.verified == false)
                    return done(null, false, { message: "Please verify your user" });
                return done(null, user);
            });
        });
    }
);
