/* Add modules */
var config = require("../config/config"),
	db = require("../config/database"),
	auth = require("../config/authentication");

/* Homepage */
exports.index = function(req, res) {
	db.User.find(function (err, users) {
		if (err) console.log("ERROR", "fetching all users:", err);
		res.render('index', { user: req.user, users: users, errors: req.flash('error') });
	});
};

/* Study section */
exports.study = function(req, res) {
	if (!req.user) {
		req.session.passport.user = auth.generateGuest();
		req.user = req.session.passport.user;
	}
	res.render('study', { user: req.user });
}

/* Coding section */
exports.coding = function(req, res) {
	if (!req.user) {
		req.session.passport.user = auth.generateGuest();
		req.user = req.session.passport.user;
	}
	res.render('coding', { user: req.user });
};

/* Sumorobot programming section */
exports.sumorobot = function(req, res) {
	if (!req.user) {
		req.session.passport.user = auth.generateGuest();
		req.user = req.session.passport.user;
	}
	res.render('sumorobot', { user: req.user });
};