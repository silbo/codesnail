'use strict';

/* Load modules */
const config = require('./');
const cors = require('cors');
const csrf = require('csurf');
const sharejs = require('share');
const express = require('express');
const flash = require('connect-flash');
const pkg = require('../../package.json');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const expressValidator = require('express-validator');

/* Expose */
module.exports = function(app, passport, sessionStore) {

    /* Use cross origin resource sharing middleware */
    app.use(cors());

    /* Express validatio middleware */
    app.use(expressValidator());

    /* Static files middleware*/
    app.use(express.static("app/public"));

    /* Set views path, template engine */
    app.set('views', 'app/views');
    app.set('view engine', 'pug');

    /* Express session */
    app.use(expressSession({
        resave: true,
        store: sessionStore,
        saveUninitialized: true,
        secret: config.session_secret,
        cookie: { maxAge : 3600000 * 24 * 3 }, /* 3 days */
    }));

    /* Connect flash for flash messages - should be declared after sessions */
    app.use(flash());

    /* Expose variables to views */
    app.use(function(req, res, next) {
        res.locals.pkg = pkg;
        res.locals.env = config.env;
        res.locals.error = req.flash('error');
        res.locals.email = req.flash('email')[0];
        res.locals.message = req.flash('message')[0];
        res.locals.username = req.flash('username')[0];
        next();
    });

    /* Use passport session */
    app.use(passport.initialize());
    app.use(passport.session());

    /* Bodyparser */
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    /* When not in testing mode, use cross-site request forgery middleware */
    if (config.env !== 'test') {
        app.use(csrf());

        app.use(function (req, res, next) {
            res.locals.csrfToken = req.csrfToken();
            next();
        });
    }

    /* Output pretty HTML in development mode */
    if (config.env === 'development') {
        app.locals.pretty = true;
    }
};
