/* Add modules */
var db = require('../config/database'),
    utils = require('../config/utils'),
    config = require('../config/config');

/* Landingpage */
exports.index = function(req, res) {
    res.render('index', {});
};

/* Dashboard */
exports.dashboard = function(req, res) {
    if (!req.user) {
        req.session.passport.user = utils.generateGuest();
        req.user = req.session.passport.user;
    }
    db.User.find(function(err, users) {
        if (err) console.log("ERROR", "fetching all users:", err);
        res.render('dashboard', { user: req.user, users: users, errors: req.flash('error') });
    });
};

var checkUser = function(req) {
    if (!req.user) {
        req.session.passport.user = utils.generateGuest();
        req.user = req.session.passport.user;
    }
};

/* Study section */
exports.study = function(req, res) {
    checkUser(req);
    res.render('study', { user: req.user });
}

/* Coding section */
exports.coding = function(req, res) {
    checkUser(req);
    res.render('coding', { user: req.user });
};

/* Chatting section */
exports.chat = function(req, res) {
    checkUser(req);
    res.render('chat', { user: req.user });
};

/* RoboKoding section */
exports.robokoding = function(req, res) {
    checkUser(req);
    res.render('robokoding', { user: req.user });
};

exports.ninjasinthebox = function(req, res) {
    checkUser(req);
    res.render('ninjasinthebox', { user: req.user });
};

exports.lucy = function(req, res) {
    checkUser(req);
    res.render('lucy', { user: req.user });
};

exports.coddee = function(req, res) {
    checkUser(req);
    res.render('coddee', { user: req.user });
};