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
	config.database_url = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "mongodb://codesnail:*C0d3Sn41l*@ds061278.mongolab.com:61278/codesnail";
	//"mongodb://localhost:27017/codesnail";
	config.hostname = "http://www.codesnail.com";
}

/* Email SMTP */
config.smtp.username = "codebuddyweb";
config.smtp.password = "StudentsofCodebuddy123";

/* Gravatar */
config.gravatar.mugshot = "http://www.gravatar.com/avatar/";
config.gravatar.profile = "http://www.gravatar.com/";

/* Google OAuth2 */
config.google.gdata_scopes = [
	"https://www.googleapis.com/auth/userinfo.email",
	"https://www.googleapis.com/auth/userinfo.profile"
];
config.google.consumer_key = "567843820810-o8k72j921k7eiuq4mr9ikavabg9k80qf.apps.googleusercontent.com";
config.google.consumer_secret= "0XlNjSGiTo4qx-CKx02SAVFS";
config.google.auth = "/auth/google";
config.google.callback = "/auth/google/callback";

/* Twitter OAuth */
config.twitter.consumer_key = "IoVfcWOfyyomVMjBxRxAQ";
config.twitter.consumer_secret = "ik74sO5Z2gKwEM0wANqBza5bIx6jf6XBnp3fQ90td2M";
config.twitter.auth = "/auth/twitter";
config.twitter.callback = "/auth/twitter/callback";

/* Facebook OAuth2 */
config.facebook.consumer_key = "630550343658490";
config.facebook.consumer_secret = "d3fd0d2c1b2407694b3452e54bc93d25";
config.facebook.auth = "/auth/facebook";
config.facebook.callback = "/auth/facebook/callback";

/* Linkedin OAuth */
config.linkedin.consumer_key = "77x0wged6rzc37";
config.linkedin.consumer_secret = "nFSpFF5dfM1H51uH";
config.linkedin.auth = "/auth/linkedin";
config.linkedin.callback = "/auth/linkedin/callback";

/* GitHub OAuth2 */
config.github.consumer_key = "d4f83e69327ff78683bc";
config.github.consumer_secret = "afd495b77ac3490d2fe914532119ba3262d7ae66";
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
