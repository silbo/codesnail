'use strict';

/* Load modules */
const config = require('./');
const users = require('../app/controllers/users');
const authorization = require('./middlewares/authorization');

/* Expose */
module.exports = function(app, passport) {

    /* Landingpage */
    app.get('/', users.index);

    /* Guest login */
    app.get('/guest', authorization.loginAsGuest, users.coding);

    /* User login and signup */
    app.get('/login', users.login);
    app.get('/logout', users.logout);
    app.all('/signup', users.signup);
    app.get('/signup/:id', users.verify);
    app.all('/forgot', users.forgotPassword);

    /* Passport authentication */
    /* Local passport */
    app.post('/login', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
    /* Google OAuth2 */
    app.get(config.google.auth, passport.authenticate('google', { scope: config.google.gdata_scopes }));
    app.get(config.google.callback, passport.authenticate('google', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
    /* Twitter OAuth */
    app.get(config.twitter.auth, passport.authenticate('twitter'));
    app.get(config.twitter.callback, passport.authenticate('twitter', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
    /* Facebook OAuth2 bug appends #_=_ to the callback URL */
    app.get(config.facebook.auth, passport.authenticate('facebook', { scope: config.facebook.scopes }));
    app.get(config.facebook.callback, passport.authenticate('facebook', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
    /* LinkedIn OAuth */
    app.get(config.linkedin.auth, passport.authenticate('linkedin', { scope: config.linkedin.scopes }));
    app.get(config.linkedin.callback, passport.authenticate('linkedin', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));
    /* GitHub OAuth2 */
    app.get(config.github.auth, passport.authenticate('github'));
    app.get(config.github.callback, passport.authenticate('github', { successRedirect: '/profile', failureRedirect: '/login', failureFlash: true }));

    /* Different tabs */
    app.get('/chat', authorization.requiresLogin, users.chat);
    app.get('/study', authorization.requiresLogin, users.study);
    app.get('/coding', authorization.requiresLogin, users.coding);
    app.get('/sumorobot', authorization.requiresLogin, users.sumorobot);
    app.get('/dashboard', authorization.requiresLogin, users.dashboard);

    /* Profile pages */
    app.get('/profile', authorization.requiresLogin, users.profile);
    app.get('/profile/:name', authorization.requiresLogin, users.detailed);
    app.post('/profile/update', authorization.requiresLogin, users.profileUpdate);
    app.post('/profile/password', authorization.requiresLogin, users.passwordUpdate);
    app.get('/profile/remove/:name', authorization.requiresLogin, users.providerRemove);
    app.get('/profile/mugshot/:provider', authorization.requiresLogin, users.mugshotUpdate);
}
