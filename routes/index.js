/* Add modules */
var config = require("../config/config");

/* Homepage */
exports.index = function(req, res) {
  res.render('index', { title: 'Express', user: req.user });
};