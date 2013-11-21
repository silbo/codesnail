/* Configuration */
var config = require("./config");

var email = require("../node_modules/emailjs/email.js");
var server = email.server.connect({
  user: config.smtp.username,
  password: config.smtp.password,
  host: "smtp.gmail.com",
  ssl: true
});

exports.sendRegistrationEmail = function sendEmail(name, email, hash) {
	server.send({
	   text:    "Welcome to CodeBuddy, verify your registration under this link " + config.hostname + "/register/" + hash, 
	   from:    "CodeBuddyWeb <codebuddyweb@gmail.com>", 
	   to:      name + " <" + email + ">",
	   subject: "CodeBuddy registration"
	}, function(err, message) { 
		if (err) console.log("ERROR", "sending email:", err);
		else console.log("INFO", "successfully sent email:", message); 
	});
}