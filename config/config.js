var config = {
	smtp: {},
	gravatar: {},
	google: {},
	twitter: {},
	facebook: {},
	linkedin: {},
	github: {},
	paypal: {},
	instagram: {},
	dropbox: {}
};

/* App hostname and port */
config.host = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "localhost";
config.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;

/* Database */
config.database_url = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "localhost:27017/codebuddy";
config.database_name = process.env.OPENSHIFT_APP_NAME || process.env.APP_NAME || "codebuddy";

/* For Openshift */
if (typeof process.env.OPENSHIFT_APP_NAME !== "undefined") {
	config.database_url = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/" +
	process.env.OPENSHIFT_APP_NAME;
}

/* Email SMTP */
config.smtp.username = "ananymous";
config.smtp.password = "ananymous";

/* Gravatar */
config.gravatar.mugshot = "http://www.gravatar.com/avatar/";
config.gravatar.profile = "http://www.gravatar.com/";

/* Google OAuth2 */
config.google.gdata_scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile"
];
config.google.consumer_key = "ananymous";
config.google.consumer_secret= "ananymous";
config.google.auth = "/auth/google";
config.google.callback = "/auth/google/callback";

/* Twitter OAuth */
config.twitter.consumer_key = "ananymous";
config.twitter.consumer_secret = "ananymous";
config.twitter.auth = "/auth/twitter";
config.twitter.callback = "/auth/twitter/callback";

/* Facebook OAuth2 */
config.facebook.consumer_key = "ananymous";
config.facebook.consumer_secret = "ananymous";
config.facebook.auth = "/auth/facebook";
config.facebook.callback = "/auth/facebook/callback";

/* Linkedin OAuth */
config.linkedin.consumer_key = "ananymous";
config.linkedin.consumer_secret = "ananymous";
config.linkedin.auth = "/auth/linkedin";
config.linkedin.callback = "/auth/linkedin/callback";

/* GitHub OAuth2 */
config.github.consumer_key = "ananymous";
config.github.consumer_secret = "ananymous";
config.github.auth = "/auth/github";
config.github.callback = "/auth/github/callback";

/* OAuth logins */
config.logins = [
	["Google", config.google.auth],
	["Twitter", config.twitter.auth],
	["Facebook", config.facebook.auth],
	["LinkedIn", config.linkedin.auth],
	["GitHub", config.github.auth]
];

module.exports = config;