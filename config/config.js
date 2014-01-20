var config = {
	smtp: {},
	gravatar: {},
	google: {},
	twitter: {},
	facebook: {},
	linkedin: {},
	github: {}
};

/* App hostname and port and session secret */
config.session_secret = process.env.SESSION_SECRET || "super-secret-u-will-never-guess";
config.host = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "localhost";
config.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;

/* Database */
/* For Openshift */
if (typeof process.env.OPENSHIFT_APP_NAME !== "undefined") {
	config.database_url = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/" +
	process.env.OPENSHIFT_APP_NAME;
	config.hostname = "https://codebuddy-students.rhcloud.com";
/* For others */
} else {
	config.database_url = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "mongodb://127.0.0.1:3000/codesnail";
	config.hostname = "http://www.codesnail.com";
}

/* Email SMTP */
config.smtp.username = process.env.SMTP_USERNAME || "anonymous";
config.smtp.password = process.env.SMTP_PASSWORD || "anonymous";

/* Gravatar */
config.gravatar.mugshot = "http://www.gravatar.com/avatar/";
config.gravatar.profile = "http://www.gravatar.com/";

/* Google OAuth2 */
config.google.gdata_scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile"
];
config.google.consumer_key = process.env.GOOGLE_KEY || "anonymous";
config.google.consumer_secret= process.env.GOOGLE_SECRET || "anonymous";
config.google.auth = "/auth/google";
config.google.callback = "/auth/google/callback";

/* Twitter OAuth */
config.twitter.consumer_key = process.env.TWITTER_KEY || "anonymous";
config.twitter.consumer_secret = process.env.TWITTER_SECRET || "anonymous";
config.twitter.auth = "/auth/twitter";
config.twitter.callback = "/auth/twitter/callback";

/* Facebook OAuth2 */
config.facebook.consumer_key = process.env.FACEBOOK_KEY || "anonymous";
config.facebook.consumer_secret = process.env.FACEBOOK_SECRET || "anonymous";
config.facebook.auth = "/auth/facebook";
config.facebook.callback = "/auth/facebook/callback";

/* Linkedin OAuth */
config.linkedin.consumer_key = process.env.LINKEDIN_KEY || "anonymous";
config.linkedin.consumer_secret = process.env.LINKEDIN_SECRET || "anonymous";
config.linkedin.auth = "/auth/linkedin";
config.linkedin.callback = "/auth/linkedin/callback";

/* GitHub OAuth2 */
config.github.consumer_key = process.env.GITHUB_KEY || "anonymous";
config.github.consumer_secret = process.env.GITHUB_SECRET || "anonymous";
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