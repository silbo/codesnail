/* Add modules */
var config = require("../config/config");

/* Homepage */
exports.index = function(req, res) {
  res.render('index', { user: req.user });
};