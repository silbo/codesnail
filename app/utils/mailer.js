'use strict';

/* Load modules */
const config = require('../config/');
const pkg = require('../../package.json');
const emailing = require('../../node_modules/emailjs/email');

/* Connect to the mailing server */
const mailServer = emailing.server.connect({
	user: config.smtp.username,
	password: config.smtp.password,
	host: config.smtp.host,
	ssl: true
});

var emailCallback = function emailCallback(err, message) {
	if (err) console.log("ERROR failed to send email:", err);
	else console.log("INFO successfully sent email:", message);
};

exports.sendRegistration = function sendRegistration(name, email, hash) {
	mailServer.send({
		text: "Welcome to " + pkg.name + ", verify your registration under this link " + config.ip + ":" + config.port + "/signup/" + hash,
		from: pkg.name + " <" + config.smtp.username + ">",
		to: name + " <" + email + ">",
		subject: pkg.name + " registration"
	}, emailCallback);
}

exports.sendResetPassword = function sendForgotPassword(name, email, hash) {
	mailServer.send({
		text: "To reset your " + pkg.name + " password visit: " + config.ip + ":" + config.port + "/signup/" + hash,
		from: pkg.name + " <" + config.smtp.username + ">",
		to: name + " <" + email + ">",
		subject: pkg.name + " password"
	}, emailCallback);
}

exports.sendErrorReport = function sendErrorReport(name, email, err, user) {
	mailServer.send({
		text: "The following error has occured: " + err + " from user: " + user.email,
		from: pkg.name + " <" + config.smtp.username + ">",
		to: name + " <" + email + ">",
		subject: pkg.name + " error"
	}, emailCallback);
}
