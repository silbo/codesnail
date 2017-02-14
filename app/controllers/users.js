'use strict';

/* Load modules */
const utils = require('../utils');
const mongoose = require('mongoose');
const config = require('../config/');
const flash = require('connect-flash');
const mailer = require('../utils/mailer');

/* Load database models */
const User = mongoose.model('User');
const Provider = mongoose.model('Provider');

/* Landingpage */
exports.index = function(req, res) {
    console.log("INFO", "rendering index");
    res.render('users/index', {});
};

/* Dashboard */
exports.dashboard = function(req, res) {
    User.find(function(err, users) {
        if (err) console.log("ERROR", "fetching all users:", err);
        res.render('users/dashboard', { user: req.user, users: users, errors: req.flash('error') });
    });
};

/* Study section */
exports.study = function(req, res) {
    res.render('users/study', { user: req.user });
}

/* Coding section */
exports.coding = function(req, res) {
    res.render('users/coding', { user: req.user });
};

/* Chatting section */
exports.chat = function(req, res) {
    res.render('users/chat', { user: req.user });
};

/* Sumorobot section */
exports.sumorobot = function(req, res) {
    res.render('users/sumorobot', { user: req.user });
};


/* Login page */
exports.login = function(req, res) {
    res.render('users/login', { logins: config.logins });
};

/* User signup from the form */
exports.signup = function(req, res) {
    /* When the submit was not pressed, do not process the form */
    if (req.method == 'GET') return res.render('users/signup');
    /* Check for form errors */
    req.assert('username', "A valid username of at least 4 and up to 15 characters is required").len(4, 15);
    req.assert('email', "A valid email is required").isEmail();
    req.assert('password', "A valid password of at least 8 and up to 50 characters is required").len(8, 50);
    req.assert('passwordConfirm', "Passwords entered do not match").equals(req.body.password);
    var errors = req.validationErrors();

    /* Pass variables to the view */
    req.flash('error', errors);
    req.flash('email', req.body.email);
    req.flash('username', req.body.username);

    /* When the form contains errors */
    if (errors) return res.redirect('/signup');

    /* Apply some filters on email and username */
    var filteredEmail = req.body.email.toString().toLowerCase().replace(" ", "");
    var filteredUsername = req.body.username.toString().toLowerCase().replace(" ", "");

    /* Find existing user */
    User.findOne({ $or:[{ username: filteredUsername }, { email: filteredEmail }] }, function(err, user) {
        if (err) return new Error(err);
        /* When the username already exists */
        else if (user && user.username == req.body.username) {
            req.flash('error', [{ msg: "Username already taken" }]);
            return res.redirect('/signup');
        }
        /* When the email is not taken */
        else if (user && user.email == req.body.email) {
            req.flash('error', [{ msg: "Email already taken" }]);
            return res.redirect("/signup");
        }
        /* When the username and email are not taken */
        console.log("INFO", "user:", user);
        var user = new User({ username: filteredUsername, name: req.body.username, email: req.body.email, password: req.body.password });
        /* Set the gravatar mugshot */
        user.profile.mugshot = config.gravatar.mugshot + utils.calculateHash("md5", user.email) + "?d=identicon";
        user.profile.joined_date = new Date();
        console.log("INFO", "user singup date:", user.profile.joined_date);
        /* Calculate the password hash */
        user.password = utils.calculateHash("sha256", user.password + user.profile.joined_date);
        /* Calculate the verification hash */
        user.verification.verification_hash = utils.calculateHash("sha256", user.email + utils.generateRandom());
        user.save(function(err) {
            if (err) console.log("ERROR", "error signing up user:", user.email, "error:", err);
            else {
                /* Send the user the verification email */
                mailer.sendRegistration(user.name, user.email, user.verification.verification_hash);
                /* Show success message to the user */
                console.log("INFO", "user saved:", user.email);
                req.flash('message', "Successfully signed up, check your inbox");
                return res.redirect('/signup');
            }
        });
    });
};

/* Signup from passport OAuth */
exports.registerUser = function (name, email, provider_name, mugshot, link, done) {
    /* Find user by email */
    User.findOne({ email: email }).populate('profile.providers').exec(function (err, user) {
        if (err) return done(err);
        /* When the user with the email was found and the provider is registered */
        else if (user && user.profile.providers.map(function(elem) { return elem.name; }).join(",").indexOf(provider_name) > -1) return done(null, user);

        /* Register a new provider */
        var provider = new Provider({ name: provider_name, mugshot: mugshot, display_name: name, url: link });
        provider.save();
        /* When no user under this email was found */
        if (!user) {
            user = new User({ username: name.toString().toLowerCase().replace(" ", "") , name: name, email: email });
            user.profile.mugshot = mugshot;
            user.profile.website = link;
        }
        /* Register this provider for the user */
        user.profile.providers.push(provider);
        /* Set the user as verified */
        user.verification.verified = true;
        /* Set the gravatar mugshot */
        user.profile.mugshot = user.profile.mugshot || config.gravatar.mugshot + utils.calculateHash("md5", user.email) + "?d=identicon";
        /* Save the user */
        user.save(function(err) {
            if (err) console.log("ERROR", "error saving user:", err);
            else {
                console.log("INFO", "user saved:", user.email);
                /* Fetch the information again, for the new provider information */
                User.findOne({ email: email }).populate('profile.providers').exec(function (err, user) {
                    if (err) console("ERROR", "error finding user:", err);
                    return done(err, user);
                });
            }
        });
    });
};

/* Forgotten password */
exports.forgotPassword = function(req, res) {
    /* When the form was not submitted */
    if (req.method == 'GET') return res.render('users/forgot');

    /* Check for form errors */
    req.assert('email', "A valid email is required").isEmail();
    var errors = req.validationErrors();

    /* Pass variables to the view */
    req.flash('error', errors);
    req.flash('email', req.body.email);

    /* When errors, show them */
    if (errors) return res.redirect('/forgot');

    var filteredEmail = req.body.email.toString().toLowerCase().replace(" ", "");

    /* Find the user and update */
    User.findOne({ email: filteredEmail }, function(err, user) {
        if (err) return new Error(err);
        else if (!user) {
            console.log("INFO", "user not found:", req.body.email);
            res.redirect('/forgot');
        }
        else {
            /* Generate a verifisilbocation hash for the user and send it by mail */
            user.verification.verification_hash = utils.calculateHash('sha256', user.email + utils.generateRandom());
            mailer.sendResetPassword(user.name, user.email, user.verification.verification_hash);

            /* Leave message and redirect */
            req.flash('email', "");
            req.flash('message', "Check your inbox to reset password");
            res.redirect('/forgot');

            /* Save the updated user */
            user.save();
        }
    });
};

/* User verification */
exports.verify = function(req, res) {
    User.findOne({ 'verification.verification_hash': req.params.id }, function(err, user) {
        if (err) return new Error(err);
        else if (!user) {
            console.log("ERROR", "error finding user:", err);
            return res.redirect('/login');
        /* When the user is already verified, log him/her in for forgotten password */
        } else if (user.verification.verified) {
            req.session.passport.user = user;
            req.user = req.session.passport.user;
            console.log("INFO", "user password reset:", user.email);
        /* When the user is not verified */
        } else {
            user.verification.verified = true;
            console.log("INFO", "user verification:", user.email);
            /* Notify the user of successful verification */
            req.flash('message', "Successfully verified");
        }
        /* Erease the users verification hash */
        user.verification.verification_hash = "";
        /* Render login once again */
        res.redirect('/login');
        /* Save the updated user */
        user.save(function(err) {
            if (err) console.log("ERROR", "error verifiying user:", user.email, "error:", err);
        });
    });
};

/* User detailed page */
exports.detailed = function(req, res) {
    User.findOne({ 'username': req.params.name }).populate('profile.providers').exec(function (err, user) {
        /* When the user is does not exist */
        if (err || !user) {
            console.log("ERROR", "error finding user:", err);
            return res.redirect("/");
        }
        res.render('detailed', { user: req.user, other_user: user });
    });
};

/* User profile page */
exports.profile = function(req, res) {
    console.log("INFO", "accessing profile:", req.user);
    /* Check which providers have been connected */
    var logins = [];
    var providers = req.user.profile.providers.map(function(elem) { return elem.name; }).join(",");
    for(var index = 0; index < config.logins.length; index++) {
        if (providers.indexOf(config.logins[index][0].toString().toLowerCase()) == -1)
            logins.push(config.logins[index]);
    }
    res.render('profile', { logins: logins, user: req.user });
};

/* Update user profile */
exports.profileUpdate = function(req, res) {
    /* Check for form errors */
    req.assert('name', "Name is required").notEmpty();
    var errors = req.validationErrors();
    /* When the form contains errors */
    if (errors) {
        req.flash('error', errors);
        return res.redirect('/profile');
    }

    /* Find the user by email */
    User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
        if (err) return new Error(err);
        /* Update the user fields */
        user.name = req.body.name;
        user.profile.description = req.body.description;
        user.profile.location = req.body.location;
        user.profile.website = req.body.website;
        /* When a mugshot was specified */
        if (typeof req.body.mugshot !== 'undefined') user.profile.mugshot = "/images/" + req.body.mugshot;
        console.log("INFO", "saving user:", user);
        user.save();

        /* Update the user object in the session */
        req.session.passport.user = user;
        return res.redirect('/profile');
    });
};

/* Update user profile */
exports.mugshotUpdate = function(req, res) {
    /* Find the user by email */
    User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
        if (err) return new Error(err);
        /* Update the user mugshot */
        for (var i = 0; i < user.profile.providers.length; i++) {
            if (user.profile.providers[i].name == req.params.provider)
                user.profile.mugshot = user.profile.providers[i].mugshot;
        }

        /* Update the user object in the session */
        req.session.passport.user = user;
        res.redirect('/profile');
        /* Save udated user to database */
        user.save();
    });
};

/* Update user password */
exports.passwordUpdate = function(req, res) {
    /* Validate the field */
    req.assert('password', "A valid password of at least 8 characters is required").len(8, 50);
    req.assert('passwordConfirm', "Passwords entered do not match").equals(req.body.password);
    var errors = req.validationErrors();
    req.flash('error', errors);
    if (errors) return res.redirect('/profile');

    /* Find the user by email */
    User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
        if (err) return new Error(err);
        /* Update the user fields */
        user.password = utils.calculateHash('sha256', req.body.password + user.profile.joined_date);
        /* Show success message */
        req.flash('message', "Successfully changed password");
        res.redirect('/profile');
        /* Save updated user to database */
        user.save();
    });
};

/* Remove provider */
exports.providerRemove = function(req, res) {
    /* Find the user by email */
    User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
        if (err || !user) return res.redirect("/profile");
        console.log("INFO", "providers before:", user.profile.providers);
        /* Check which provider to remove */
        for(var index = 0; index < user.profile.providers.length; index++) {
            /* When the correct provider was found */
            if (user.profile.providers[index].name == req.params.name) {
                /* Find the provider in the database */
                Provider.findOne({ _id: user.profile.providers[index]._id }, function(err, provider) {
                    if (err) return new Error(err);
                    /* Remove the provider */
                    provider.remove();
                    console.log("INFO", "successfully removed provider:", req.params.name);
                    /* Remove the provider also from the user object */
                    user.profile.providers.splice(index, 1);
                    user.save();
                    /* Update the user in the session */
                    console.log("INFO", "user now:", user);
                    req.session.passport.user = user;
                    return res.redirect('/profile');
                });
                break;
            }
        }
    });
};

/* Logout function */
exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};
