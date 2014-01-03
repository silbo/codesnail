/* Add modules */
var config = require("../config/config"),
	db = require("../config/database");

/* Homepage */
exports.index = function(req, res) {
	db.User.find(function (err, users) {
		if (err) console.log("ERROR", "fetching all users:", err);
		res.render('index', { user: req.user, users: users });
	});
};

/* Coding section */
exports.coding = function(req, res) {
	res.render('coding', { user: req.user });
};