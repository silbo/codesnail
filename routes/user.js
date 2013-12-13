/* Add modules */
var config = require("../config/config"),
	db = require("../config/database"),
	email = require("../config/email"),
	auth = require("../config/authentication"),
	flash = require('connect-flash'),
	fs = require('fs');

/* Login page */
exports.login = function(req, res) {
	if (req.isAuthenticated(req, res)) return res.redirect("/profile");
	res.render("login", { logins: config.logins, errors: req.flash('error') || [] });
};

/* User registration */
exports.register = function(req, res) {
	/* When the submit was not pressed, do not process the form */
	if (req.body.register != "Register") return res.render("register", { errors: [], name: "", email: "" });
	/* Check for form errors */
	req.assert("name", "Name is required").notEmpty();
	req.assert("email", "A valid email is required").isEmail();
	req.assert("password", "A valid password of at least 8 characters is required").len(8, 50);
	req.assert("passwordConfirm", "Passwords entered do not match").equals(req.body.password);
	var errors = req.validationErrors();
	/* When the form contains errors */
	if (errors) return res.render("register", { errors: errors, name: req.body.name, email: req.body.email });

	/* Find existing user */
	db.User.findOne({ email: req.body.email }, function (err, user) {
	  if (err) console.log("ERROR", "error finding user:", err);
	  else if (user) console.log("INFO", "email already takes:", req.body.email);
	  if (err || user) return res.render("register", { errors: [{ msg: "Email already taken" }], name: req.body.name, email: req.body.email });

	  /* When the email is not taken */
	  console.log("INFO", "user:", user);
		var user = new db.User({ name: req.body.name, email: req.body.email, password: req.body.password });
		user.save(function(err) {
		  if (err) console.log("ERROR", "error saving user:", err);
		  else {
		    console.log("INFO", "user saved:", user.email);
				return res.render("register", { message: "Successfully signed up, check your inbox", errors: [], name: "", email: "" });
		  }
		});
	});
};

exports.forgotPassword = function(req, res) {
	/* When the form was not submitted */
	if (req.body.reset != "Submit") return res.render("forgot", { errors: [], message: "", email: "" });

	/* Check for form errors */
	req.assert("email", "A valid email is required").isEmail();
	var errors = req.validationErrors();
	var message = "";
	/* Cehck if fields are valid and email is defined */
	if (!errors) {
		db.User.findOne({ email: req.body.email }, function (err, user) {
			if (err) console.log("ERROR", "finding user:", err);
			else if (!user) console.log("INFO", "user not found:", req.body.email);
			else {
				user.password = auth.calculateHash("sha256", user.email + user.joined_date);
				email.sendForgotPassword(user.name, user.email, user.password);
				user.password = auth.calculateHash("sha256", user.password + user.joined_date);
				user.save();
			}
		});
		message = "Successfully signed up, check your inbox";
		req.body.email = "";
	}
	res.render("forgot", { errors: errors || [], message: message, email: req.body.email || "" });
};

exports.verify = function(req, res) {
	db.User.findOne({ 'verification.verification_hash': req.params.id }, function (err, user) {
		if (err || !user) {
			console.log("ERROR", "error finding user:", err);
			return res.redirect("/login");
		/* When the user is already verified */
		} else if (user.verification.verified) return res.redirect("/login");
  	/* Verify the user */
  	db.User.update({ 'verification.verification_hash': req.params.id }, { $set: { 'verification.verified': true } }, {upsert: true}, function(err) {
	    if (err) {
	    	console.log("ERROR", "error verifing user:", err);
	    	return res.redirect("/login");
	    }
    	console.log("INFO", "user successfully verified:", user.email);
    	/* Notify the user of successful verification */
    	res.render("login", { logins: config.logins, errors: [], message: "Successfully verified" });
	  });
	});
};

/* User profile page */
exports.profile = function(req, res) {
	/* Check which providers have been connected */
	var logins = [];
	var providers = req.user.profile.providers.map(function(elem) { return elem.name; }).join(",");
	for(var index = 0; index < config.logins.length; index++) {
    if (providers.indexOf(config.logins[index][0].toLowerCase()) == -1)
    	logins.push(config.logins[index]);
  }
	res.render("profile", { logins: logins, user: req.user, message: req.flash('message'), errors: req.flash('error') || [] });
};

/* Update user profile */
exports.profileUpdate = function(req, res) {
	/* Validate the field */

	/* When a mugshot was given, upload it */
	if (req.files.mugshot.originalFilename != "") {
		var localPath = __dirname + "/../public";
		var remotePath = "/images/" + auth.calculateHash("md5", req.user.email) + req.files.mugshot.name;
		localPath += remotePath;
		fs.readFile(req.files.mugshot.path, function (err, data) {
			fs.writeFile(localPath, data, function(err) {
				console.log("INFO", "upload finished:", localPath);
			});
		});
	}

	/* Find the user by email */
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec(function (err, user) {
		if (err) { console.log("ERROR", "finding user:", err); return res.redirect("/profile"); }
		/* Update the user fields */
		user.name = req.body.name
		user.profile.description = req.body.description;
		user.profile.location = req.body.location;
		user.profile.website = req.body.website;
		/* When a mugshot was specified */
		if (typeof remotePath !== "undefined") user.profile.mugshot = remotePath;
		user.save();

		/* Update the user object in the session */
		req.session.passport.user = user;
		res.redirect("/profile");
	});
};

/* Update user profile */
exports.mugshotUpdate = function(req, res) {
	/* Find the user by email */
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec(function (err, user) {
		if (err) { console.log("ERROR", "finding user:", err); return res.redirect("/profile"); }
		/* Update the user mugshot */
		for (var i = 0; i < user.profile.providers.length; i++)
			if (user.profile.providers[i].name == req.params.provider)
				user.profile.mugshot = user.profile.providers[i].mugshot;
		user.save();

		/* Update the user object in the session */
		req.session.passport.user = user;
		res.redirect("/profile");
	});
};

/* Update user password */
exports.passwordUpdate = function(req, res) {
	/* Validate the field */
	req.assert("password", "A valid password of at least 8 characters is required").len(8, 50);
	req.assert("passwordConfirm", "Passwords entered do not match").equals(req.body.password);
	var errors = req.validationErrors();
	req.flash('error', errors);
	if (errors) return res.redirect("/profile");

	/* Find the user by email */
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec(function (err, user) {
		if (err) { console.log("ERROR", "finding user:", err); return res.redirect("/profile"); }
		/* Update the user fields */
		user.password = auth.calculateHash("sha1", req.body.password);
		user.save();
		req.flash('message', "Successfully changed password");
		res.redirect("/profile");
	});
};

/* Remove provider */
exports.providerRemove = function(req, res) {
	/* Find the user by email */
	db.User.findOne({ email: req.user.email }).populate('profile.providers').exec(function (err, user) {
		if (err || !user) return res.redirect("/profile");
		console.log("INFO", "providers before:", user.profile.providers);
		/* Check which provider to remove */
		for(var index = 0; index < user.profile.providers.length; index++) {
			/* When the correct provider was found */
			if (user.profile.providers[index].name == req.params.name) {
				/* Find the provider in the database */
				db.Provider.findOne({ _id: user.profile.providers[index]._id }, function(err, provider) {
					if (err) { 
						console.log("ERROR", "error finding provider:", err); 
						return res.redirect("/profile");
					}
					/* Remove the provider */
					provider.remove();
					console.log("INFO", "successfully removed provider:", req.params.name);
					/* Remove the provider also from the user object */
					user.profile.providers.splice(index, 1);
					user.save();
					/* Update the user in the session */
					console.log("INFO", "user now:", user);
					req.session.passport.user = user;
					return res.redirect("/profile");
				});
				break;
			}
		}
	});
};

/* All users page */
exports.list = function(req, res) {
  res.send("respond with a resource");
};

/* Logout function */
exports.logout = function(req, res) {
	req.logout();
	res.redirect("/login");
};