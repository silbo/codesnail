/* Add modules */
var config = require("../config/config"),
	db = require("../config/database");

/* Login page */
exports.login = function(req, res) {
	res.render("login", { logins: config.logins, errors: req.session.messages || [] });
	req.session.messages = [];
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
				return res.render("register", { messages: "Successfully signed up, check your inbox", errors: [], name: "", email: "" });
		  }
		});
	});
};

exports.verify = function(req, res) {
	db.User.findOne({ 'verification.verification_hash': req.params.id }, function (err, user) {
		if (err || !user) {
			console.log("ERROR", "error finding user:", err);
			return res.redirect("/login");
		}
  	db.User.update({ 'verification.verification_hash': req.params.id }, { $set: { 'verification.verified': true } }, {upsert: true}, function(err) {
	    if (err) {
	    	console.log("ERROR", "error verifing user:", err);
	    	return res.redirect("/login");
	    }
    	console.log("INFO", "user successfully verified:", user.email);
    	/* Login the user */
    	req.login(user, function(err) {
       	if (err) console.log("ERROR", "logging in:", err);
        else return res.redirect("/");
      });
	  });
	});
};

/* User profile page */
exports.profile = function(req, res) {
	res.render("profile", { user: req.user, profile: JSON.stringify(req.user.profile) });
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