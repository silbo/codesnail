/* Add modules */
var flash = require('connect-flash'),
	db = require('../config/database'),
	utils = require('../config/utils'),
	config = require('../config/config'),
	emailing = require('../config/email');

/* Login page */
exports.login = function(req, res) {
	if (req.user && req.user.verification && req.user.verification.verified) return res.redirect('/profile');
	
	res.render('login', { logins: config.logins });
};

/* User signup */
exports.signup = function(req, res) {
	/* When the submit was not pressed, do not process the form */
	if (req.method == 'GET') return res.render('signup');
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
	var filteredEmail = req.body.email.toLowerCase().replace(" ", "");
	var filteredUsername = req.body.username.toLowerCase().replace(" ", "");

	/* Find existing user */
	db.User.findOne({ $or:[{ username: filteredUsername }, { email: filteredEmail }] }, function(err, user) {
		if (err) return new Error(err);
		else if (!user) {
			req.flash('error', [{ msg: "Databse error" }]);
			return res.redirect("/signup");
		}
		/* When the email already exists */
		else if (user && user.email == req.body.email) {
			req.flash('error', [{ msg: "Email already taken" }]);
			return res.redirect("/signup");
		/* When the username already exists */
		} else if (user && user.username == req.body.username) {
			req.flash('error', [{ msg: "Username already taken" }]);
			return res.redirect('/signup');
		}
		/* When the email is not taken */
		console.log("INFO", "user:", user);
		var user = new db.User({ username: filteredUsername, name: req.body.username, email: req.body.email, password: req.body.password });
		user.save(function(err) {
			if (err) return new Error(err);
			else {
				console.log("INFO", "user saved:", user.email);
				req.flash('message', "Successfully signed up, check your inbox");
				return res.redirect('/signup');
			}
		});
	});
};

/* Forgotten password */
exports.forgotPassword = function(req, res) {
	/* When the form was not submitted */
	if (req.method == 'GET') return res.render('forgot');

	/* Check for form errors */
	req.assert('email', "A valid email is required").isEmail();
	var errors = req.validationErrors();
	
	/* Pass variables to the view */
	req.flash('error', errors);
	req.flash('email', req.body.email);

	/* When errors, show them */
	if (errors) return res.redirect('/forgot');

	var filteredEmail = req.body.email.toLowerCase().replace(" ", "");

	/* Find the user and update */
	db.User.findOne({ email: filteredEmail }, function(err, user) {
		if (err) return new Error(err);
		else if (!user) {
			console.log("INFO", "user not found:", req.body.email);
			res.redirect('/forgot');
		}
		else {
			/* Generate a verification hash for the user and send it by mail */
			user.verification.verification_hash = utils.calculateHash('sha256', user.email + user.joined_date);
			emailing.sendResetPassword(user.name, user.email, user.verification.verification_hash);
			user.save();

			/* Leave message and redirect */
			req.flash('email', "");
			req.flash('message', "Check your inbox to reset password");
			res.redirect('/forgot');
		}
	});
};

/* User verification */
exports.verify = function(req, res) {
	db.User.findOne({ 'verification.verification_hash': req.params.id }, function(err, user) {
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
		}
		/* Erease the users verification hash */
		user.verification.verification_hash = "";
		/* Notify the user of successful verification */
		req.flash('message', "Successfully verified");
		res.redirect('/login');
		/* Save the updated user */
		user.save();
	});
};

/* User detailed page */
exports.detailed = function(req, res) {
	db.User.findOne({ 'username': req.params.name }).populate('profile.providers').exec(function (err, user) {
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
		if (providers.indexOf(config.logins[index][0].toLowerCase()) == -1)
			logins.push(config.logins[index]);
	}
	res.render('profile', { logins: logins, user: req.user, message: req.flash('message') || "", errors: req.flash('error') || [] });
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
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
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
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
		if (err) return new Error(err);
		/* Update the user mugshot */
		for (var i = 0; i < user.profile.providers.length; i++) {
			if (user.profile.providers[i].name == req.params.provider)
				user.profile.mugshot = user.profile.providers[i].mugshot;
		}
		user.save();

		/* Update the user object in the session */
		req.session.passport.user = user;
		res.redirect('/profile');
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
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
		if (err) return new Error(err);
		/* Update the user fields */
		user.password = utils.calculateHash('sha256', req.body.password + user.joined_date);
		user.save();
		req.flash('message', "Successfully changed password");
		res.redirect('/profile');
	});
};

/* Remove provider */
exports.providerRemove = function(req, res) {
	/* Find the user by email */
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec( function(err, user) {
		if (err || !user) return res.redirect("/profile");
		console.log("INFO", "providers before:", user.profile.providers);
		/* Check which provider to remove */
		for(var index = 0; index < user.profile.providers.length; index++) {
			/* When the correct provider was found */
			if (user.profile.providers[index].name == req.params.name) {
				/* Find the provider in the database */
				db.Provider.findOne({ _id: user.profile.providers[index]._id }, function(err, provider) {
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