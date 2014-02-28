/* Add modules */
var config = require('./config');
	emailing = require('../node_modules/emailjs/email.js');

var server = emailing.server.connect({
	user: config.smtp.username,
	password: config.smtp.password,
	
	ssl: true
});

var emailErrorFunction = function errorFunction(err, message) {
	if (err) console.log("ERROR", "sending email:", err);
	else console.log("INFO", "successfully sent email:", message);
};

exports.sendRegistration = function sendRegistration(name, email, hash) {
	server.send({
		text: "Welcome to " + config.app_name + ", verify your registration under this link " + config.hostname + "/signup/" + hash,
		from: config.app_name + " <" + config.app_email + ">",
		to: name + " <" + email + ">",
		subject: config.app_name + " registration"
	}, emailErrorFunction);
}

exports.sendResetPassword = function sendForgotPassword(name, email, hash) {
	server.send({
		text: "To reset you " + config.app_name + " password visit: " + config.hostname + "/login",
		from: config.app_name + " <" + config.app_email + ">",
		to: name + " <" + email + ">",
		subject: config.app_name + " password"
	}, emailErrorFunction);
}

exports.sendErrorReport = function sendErrorReport(name, email, error) {
	server.send({
		text: "The following error has occured: " + error,
		from: config.app_name + " <" + config.app_email + ">",
		to: name + " <" + email + ">",
		subject: config.app_name + " error"
	}, emailErrorFunction);
}