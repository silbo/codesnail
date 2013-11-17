#!/bin/env node

/* Global variables */
/* URLs */
var gravatarMugshotUrl = "http://www.gravatar.com/avatar/";
var gravatarProfileUrl = "http://www.gravatar.com/";
var googleRedirectUrl = "https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=";
var googleUserInfoUrl = "https://www.googleapis.com/userinfo/v2/me";
var twitterRedirectUrl = "https://twitter.com/oauth/authenticate?oauth_token=";
var twitterUserInfoUrl = "https://api.twitter.com/1.1/users/show.json";
var facebookRedirectUr = "undefined";
var facebookUserInfoUrl = "undefined";
var oauthRedirectUrl = "undefined";
var oauthUserInfoUrl = "undefined";
/* Development, Testing and Production */
var collections = ["users", "reports"];
var host = process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || process.env.IP || "localhost";
var port = process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || process.env.PORT || 3000;
var databaseUrl = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || "codebuddy";
var oAuthUrl = "http://" + host + ":" + port;
/* For Openshift */
if (typeof process.env.OPENSHIFT_APP_NAME !== "undefined") {
	databaseUrl = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/" +
	process.env.OPENSHIFT_APP_NAME;
	oAuthUrl = "https://codebuddy-students.rhcloud.com";
}

/* Add libraries */
var express = require('express');
var app = express();
var db = require("mongojs").connect(databaseUrl, collections);
var oauth = require('oauth').OAuth;
var querystring = require('querystring');
var crypto = require('crypto');

/* Set app properties */
app.set('title', 'CodeBuddy');
app.use(express.logger());
app.use(express.urlencoded());
app.use(express.json());
app.use(express.cookieParser());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.session({
  secret: "aslkdsalkdjLKLKSJDL3423432"
}));

/* Google URLs */
function requireLogin(req, res, next) {
  if (typeof req.session.oauthToken === "undefined") {
    res.redirect("/login?action=" + querystring.escape(req.originalUrl));
    return;
  }
  next();
};

/* Request an OAuth Request Token, and redirects the user to authorize it */
app.get('/login', function(req, res) {
  var googleRequestTokenUrl = "https://www.google.com/accounts/OAuthGetRequestToken";
  
  /* GData specifid: scopes that wa want access to */
  var gdataScopes = [
    querystring.escape("https://www.googleapis.com/auth/userinfo.email"),
    querystring.escape("https://www.googleapis.com/auth/userinfo.profile")];
  
  console.log("DEBUG", "oauth method:", req.param('oauth'));
  var oa = "undefined";
  if (req.param('oauth') == "google") {
  	console.log("DEBUG", "logging in with google");
  	oauthRedirectUrl = googleRedirectUrl;
  	oauthUserInfoUrl = googleUserInfoUrl;
	  /* Google OAuth */
	  oa = new oauth(
	  	googleRequestTokenUrl + "?scope=" + gdataScopes.join('+'),
	    "https://www.google.com/accounts/OAuthGetAccessToken",
	    "anonymous",
	    "anonymous",
	    "2.0",
	    oAuthUrl + "/callback",
	    "HMAC-SHA1");
	} else if (req.param('oauth') == "twitter") {
		console.log("DEBUG", "logging in with twitter");
		oauthRedirectUrl = twitterRedirectUrl;
		oauthUserInfoUrl = twitterUserInfoUrl;
	  /* Twitter OAuth */
		oa = new oauth(
		  "https://api.twitter.com/oauth/request_token",
		  "https://api.twitter.com/oauth/access_token",
		  "anonymous",
		  "anonymous",
		  "1.0A",
		  oAuthUrl + "/callback",
		  "HMAC-SHA1");
	} else if (req.param('oauth') == "facebook") {
		console.log("DEBUG", "logging in with facebook");
		oauthRedirectUrl = facebookRedirectUr;
		oauthUserInfoUrl = facebookUserInfoUrl;
		res.json({ error: "no_facebook_login_yet" });
		return;
	} else {
		/* No such login action, render login again */
		res.render("login.ejs");
	}

  oa.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      console.log("ERROR", "getting OAuth request token:", error);
    } else { 
	    /* Store the tokens in the session */
	    req.session.oa = oa;
	    req.session.oauthToken = oauthToken;
	    req.session.oauthTokenSecret = oauthTokenSecret;
	    /* Redirect the user to authorize the token */
	    res.redirect(oauthRedirectUrl + oauthToken);
    }
  })
});

/* Callback for the authorization page */
app.get('/callback', function(req, res) {
  /* Get the OAuth access token with the 'oauth_verifier' that we received */
  var oa = new oauth(
  	req.session.oa._requestUrl,
    req.session.oa._accessUrl,
    req.session.oa._consumerKey,
    req.session.oa._consumerSecret,
    req.session.oa._version,
    req.session.oa._authorize_callback,
    req.session.oa._signatureMethod);
  console.log(oa);
        
  oa.getOAuthAccessToken(
    req.session.oauthToken,
    req.session.oauthTokenSecret, 
    req.param('oauth_verifier'),
    function(error, oauthToken, oauthTokenSecret, results) {           
	    if (error) {
	      console.log("ERROR", "getting OAuth access token:", error);
	     } else {
	     	/* For Twitter */
	     	req.session.username = results.screen_name;
        /* Store the access token in the session */
        req.session.oauthToken = oauthToken;
        req.session.oauthTokenSecret = oauthTokenSecret;
        res.redirect("/main");
     	}
  	});
});

app.get('/main', requireLogin, function(req, res) {
	var oa = new oauth(
		req.session.oa._requestUrl,
    req.session.oa._accessUrl,
    req.session.oa._consumerKey,
    req.session.oa._consumerSecret,
    req.session.oa._version,
    req.session.oa._authorize_callback,
    req.session.oa._signatureMethod);
	console.log(oa);

  /* Example using GData API v3 */
  /* GData Specific Header */
  oa._headers['GData-Version'] = '3';

  oa.getProtectedResource(
	  oauthUserInfoUrl + "?screen_name=" + req.session.username,
	  "GET",
	  req.session.oauthToken, 
	  req.session.oauthTokenSecret,
	  function (error, data, response) {
	    var feed = JSON.parse(data);

	    /* Calculate gravatar hash */
	    var gravatarHash = "";
    	if (typeof feed['email'] !== "undefined") {
    		var shasum = crypto.createHash('md5');
   			shasum.update(feed['email']);
   			gravatarHash = shasum.digest('hex');
	    }
	    /* Define the mugshot image (google, twitter, gravatar) */
	    feed['mugshot_src'] = feed['picture'] || feed['profile_image_url'] || gravatarMugshotUrl + gravatarHash;
	    feed['profile_name'] = feed['name'] || feed['screen_name'] || "Anonymous";
	    feed['profile_url'] = feed['link'] || feed['url'] || gravatarProfileUrl + gravatarHash;
	    /* Render the response */
	    res.render('main.ejs', {
	      locals: { feed: feed }
	    });
  	});
});

/* Save to db */
db.users.remove({email: "kati@gmail.com", password: "iLoveMongo", sex: "female"}, function(err, saved) {
  if( err || !saved ) console.log("User exists");
  else console.log("User saved");
});

/* Fetch from db */
db.users.find({sex: "female"}, function(err, users) {
  if( err || !users) console.log("No female users found");
  else users.forEach( function(femaleUser) {
    console.log(femaleUser);
  });
});

/* Homepage */
app.get('/', function(req, res) {
	if(typeof req.session.oauth_access_token === "undefined")
  	res.render("login.ejs");
	else
	  res.redirect("/main");
});

/* Start the app */
app.listen(port, host);
console.log('Listening on port ' + port);