var config = { smtp: {}, gravatar: {}, google: {}, twitter: {}, facebook: {}, linkedin: {},	github: {} };

/* App hostname and port and session secret */
config.app_name = process.env.APP_NAME || "default";
config.admin_name = process.env.ADMIN_NAME || "default";
config.admin_email = process.env.ADMIN_EMAIL || "default";
config.session_secret = process.env.SESSION_SECRET || "default";
config.hostname = process.env.HOSTNAME || "http://localhost:3000";
config.port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
config.host = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "localhost";
config.database_url = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "mongodb://localhsot:27017/codesnail";

/* Database For Openshift */
if (typeof process.env.OPENSHIFT_APP_NAME !== "undefined") {
	config.database_url = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/" +
	process.env.OPENSHIFT_APP_NAME;
}

/* Email SMTP */
config.smtp.host = process.env.SMTP_HOST || "default";
config.smtp.username = process.env.SMTP_USERNAME || "default";
config.smtp.password = process.env.SMTP_PASSWORD || "default";

/* Gravatar */
config.gravatar.mugshot = "http://www.gravatar.com/avatar/";
config.gravatar.profile = "http://www.gravatar.com/";

/* Google OAuth2 */
config.google.gdata_scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile"
];
config.google.auth = "/auth/google";
config.google.callback = "/auth/google/callback";
config.google.consumer_key = process.env.GOOGLE_KEY || "default";
config.google.consumer_secret= process.env.GOOGLE_SECRET || "default";

/* Twitter OAuth */
config.twitter.auth = "/auth/twitter";
config.twitter.callback = "/auth/twitter/callback";
config.twitter.consumer_key = process.env.TWITTER_KEY || "default";
config.twitter.consumer_secret = process.env.TWITTER_SECRET || "default";

/* Facebook OAuth2 */
config.facebook.auth = "/auth/facebook";
config.facebook.callback = "/auth/facebook/callback";
config.facebook.consumer_key = process.env.FACEBOOK_KEY || "default";
config.facebook.consumer_secret = process.env.FACEBOOK_SECRET || "default";

/* Linkedin OAuth */
config.linkedin.auth = "/auth/linkedin";
config.linkedin.callback = "/auth/linkedin/callback";
config.linkedin.consumer_key = process.env.LINKEDIN_KEY || "default";
config.linkedin.consumer_secret = process.env.LINKEDIN_SECRET || "default";

/* GitHub OAuth2 */
config.github.auth = "/auth/github";
config.github.callback = "/auth/github/callback";
config.github.consumer_key = process.env.GITHUB_KEY || "default";
config.github.consumer_secret = process.env.GITHUB_SECRET || "default";

/* OAuth logins */
config.logins = [
	["Google", config.google.auth],
	["GitHub", config.github.auth],
	["Twitter", config.twitter.auth],
	["Facebook", config.facebook.auth],
	["LinkedIn", config.linkedin.auth],
];

module.exports = config;