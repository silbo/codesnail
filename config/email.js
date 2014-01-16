/* Add modules */
var config = require('./config');
	emailing = require('../node_modules/emailjs/email.js');

var server = emailing.server.connect({
	user: config.smtp.username,
	password: config.smtp.password,
	host: "smtp.gmail.com",
	ssl: true
});

exports.sendRegistrationEmail = function sendEmail(name, email, hash) {
	server.send({
		text: "Welcome to CodeSnail, verify your registration under this link " + config.hostname + "/register/" + hash,
		from: "CodeSnail <codebuddyweb@gmail.com>",
		to: name + " <" + email + ">",
		subject: "CodeSnail registration"
	}, function(err, message) {
		if (err) console.log("ERROR", "sending email:", err);
		else console.log("INFO", "successfully sent email:", message);
	});
}

exports.sendForgotPassword = function sendEmail(name, email, password) {
	server.send({
		text: "CodeSnail, your new password is: " + password + " login at " + config.hostname + "/login",
		from: "CodeSnail <codebuddyweb@gmail.com>",
		to: name + " <" + email + ">",
		subject: "CodeSnail password"
	}, function(err, message) {
		if (err) console.log("ERROR", "sending email:", err);
		else console.log("INFO", "successfully sent email:", message);
	});
}