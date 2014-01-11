/* Add modules */
var db = require('../config/database'),
	utils = require('../config/utils'),
	config = require('../config/config');

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
		req.session.passport.user = utils.generateGuest();
		req.user = req.session.passport.user;
	}
	res.render('study', { user: req.user });
}

/* Coding section */
exports.coding = function(req, res) {
	if (!req.user) {
		req.session.passport.user = utils.generateGuest();
		req.user = req.session.passport.user;
	}
	else if (req.body.points) {
		req.session.passport.user.profile.points += parseInt(req.body.points);
		db.User.findOne({ email: req.user.email }).populate('profile.providers').exec(function (err, user) {
			if (user) {
				user.pofile.points = parseInt(req.body.points);
				user.save();
			}
		});
	}
	res.render('coding', { user: req.user });
};

/* Sumorobot programming section */
exports.sumorobot = function(req, res) {
	if (!req.user) {
		req.session.passport.user = utils.generateGuest();
		req.user = req.session.passport.user;
	}
	res.render('sumorobot', { user: req.user });
};