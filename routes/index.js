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

/* Study section */
exports.study = function(req, res) {
    if (!req.user) {
        req.session.passport.user = utils.generateGuest();
        console.log(req.session.passport.user);
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

/* Chatting section */
exports.chat = function(req, res) {
    if (!req.user) {
        req.session.passport.user = utils.generateGuest();
        req.user = req.session.passport.user;
    }
    res.render('chat', { user: req.user });
};