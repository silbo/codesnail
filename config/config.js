var config = {};

config.smtp = {};
config.gravatar = {};
config.google = {};
config.twitter = {};
config.facebook = {};

/* App hostname and port */
config.hostname = "http://localhost:3000";
config.host = process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || process.env.IP || "localhost";
config.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.OPENSHIFT_INTERNAL_PORT || process.env.PORT || 3000;

/* Database URL */
config.database_url = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "localhost";

/* For Openshift */
if (typeof process.env.OPENSHIFT_APP_NAME !== "undefined") {
	config.database_url = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/" +
	process.env.OPENSHIFT_APP_NAME;
	config.hostname = "https://codebuddy-students.rhcloud.com";
}

/* Email SMTP */
config.smtp.username = "anonymous";
config.smtp.password = "anonymous";

/* Gravatar */
config.gravatar.mugshot = "http://www.gravatar.com/avatar/";
config.gravatar.profile = "http://www.gravatar.com/";

/* Google OAuth2 */
config.google.gdata_scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile"
];
config.google.consumer_key = "anonymous";
config.google.consumer_secret= "anonymous";
config.google.auth = "/auth/google";
config.google.callback = "/auth/google/callback";

/* Twitter OAuth */
config.twitter.consumer_key = "anonymous";
config.twitter.consumer_secret = "anonymous";
config.twitter.auth = "/auth/twitter";
config.twitter.callback = "/auth/twitter/callback";

/* Facebook OAuth2 */
config.facebook.consumer_key = "anonymous";
config.facebook.consumer_secret = "anonymous";
config.facebook.auth = "/auth/facebook";
config.facebook.callback = "/auth/facebook/callback";

/* OAuth logins */
config.logins = {
	"Google+": config.google.auth,
	"Twitter": config.twitter.auth,
	"Facebook": config.facebook.auth
};

module.exports = config;