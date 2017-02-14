'use strict';

/* Load modules */
const utils = require('../../utils/');

/* Middleware to generate a guest user and login */
exports.loginAsGuest = function(req, res, next) {
    /* No need to do anything when user already exists */
    if (req.user) return next();
    /* Generate a guest user and login */
    req.logIn(utils.generateGuest(), next);
};

/* Middleware to ensure user is authenticated. Otherwise send to login page. */
exports.requiresLogin = function(req, res, next) {
    /* When user is logged in */
    if (req.isAuthenticated()) {
        /* When guest user, the profile is not available */
        if (req.user.guest && req.url == "/profile") {
            req.flash('error', ["Guest users have no profile"]);
            return res.redirect("/dashboard");
        }
        return next();
    }
    /* When user is not logged in */
    res.redirect('/');
}
