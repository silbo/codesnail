#!/bin/env node

/* Global variables */
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

/* Twitter OAuth */
var oa = new oauth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  "anonymous",
  "anonymous",
  "1.0A",
  oAuthUrl + "/auth/twitter/callback",
  "HMAC-SHA1");

/* Twitter URLs */
app.get('/sessions/connect', function(req, res) {
  oa.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth request token : " + error.toString(), 500);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authenticate?oauth_token=" + req.session.oauthRequestToken);
    }
  });
});
 
app.get('/auth/twitter/callback', function(req, res) {
  sys.puts(">>"+req.session.oauthRequestToken);
  sys.puts(">>"+req.session.oauthRequestTokenSecret);
  sys.puts(">>"+req.query.oauth_verifier);
  oa.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + sys.inspect(error) + "[" + oauthAccessToken + "]" + "[" + oauthAccessTokenSecret + "]" + "[" + sys.inspect(results) + "]", 500);
    } else {
      console.log(results);
      req.session.user_id = results.id;
      req.session.screen_name = results.screen_name;
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
      
      var hash = crypto.createHash('sha1');
      hash.update(oauthAccessToken);
      /* Session storage */
      client.set(hash.digest('hex'), oauthAccessToken.toString(), redis.print);
 
      var hash = crypto.createHash('sha1');
      hash.update(oauthAccessTokenSecret);
      /* Session storage */
      client.set(hash.digest('hex'), oauthAccessTokenSecret.toString(), redis.print);
      /* Right here is where we would write out some nice user stuff */
      oa.get("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=daemonfire", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
        if (error) {
          res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
        } else {
          console.log(data);
          req.session.twitterScreenName = data["screen_name"];
          res.json(data);
        }
      });
    }
  });
});
 
app.get('/timeline', function(req, res) {
  oa.get("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=daemonfire", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
    if (error) {
      res.send("Error getting twitter timeline for screen name : daemonfire " + sys.inspect(error), 500);
    } else {
      console.log(data);
      req.session.twitterScreenName = data["screen_name"];
      res.json(JSON.parse(data));
    }
  });
});
 
app.get('/searchapi', function(req, res) {
  oa.get('https://api.twitter.com/1.1/search/tweets.json?q='+encodeURIComponent('#SEARCHTEARM'), req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
    if (error) {
      res.send("Error getting twitter timeline for screen name : " + sys.inspect(error), 500);
    } else {
      console.log(data);
      res.json(JSON.parse(data));
    }
  });
});
 
app.post('/post/status', function(req, res) {
  var matches = true;
  if (matches !== null) {
    oa.post(
      "http://api.twitter.com/1.1/statuses/update.json",
      req.session.oauthAccessToken, req.session.oauthAccessTokenSecret,
      { "status": req.body.status },
      function(error, data) {
        if(error)
          console.log(require('sys').inspect(error));
        else
          console.log(data);
      });
  }
});

/* Google URLs */
function require_google_login(req, res, next) {
  if (!req.session.oauth_access_token) {
    res.redirect("/google_login?action=" + querystring.escape(req.originalUrl));
    return;
  }
  next();
};

/* Request an OAuth Request Token, and redirects the user to authorize it */
app.get('/google_login', function(req, res) {
  var getRequestTokenUrl = "https://www.google.com/accounts/OAuthGetRequestToken";
  
  /* GData specifid: scopes that wa want access to */
  var gdataScopes = [
    querystring.escape("https://www.googleapis.com/auth/userinfo.email"),
    querystring.escape("https://www.googleapis.com/auth/userinfo.profile")];
  
  var oa = new oauth(
  	getRequestTokenUrl + "?scope=" + gdataScopes.join('+'),
    "https://www.google.com/accounts/OAuthGetAccessToken",
    "anonymous",
    "anonymous",
    "2.0",
    oAuthUrl + "/google_cb" + ( req.param('action') && req.param('action') != "" ? "?action=" + querystring.escape(req.param('action')) : "" ),
    "HMAC-SHA1");

  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) {
      console.log('error');
      console.log(error);
    }
    else { 
	    /* Store the tokens in the session */
	    req.session.oa = oa;
	    req.session.oauth_token = oauth_token;
	    req.session.oauth_token_secret = oauth_token_secret;

	    /* Redirect the user to authorize the token */
	    res.redirect("https://www.google.com/accounts/OAuthAuthorizeToken?oauth_token=" + oauth_token);
    }
  })
});

/* Callback for the authorization page */
app.get('/google_cb', function(req, res) {
  /* Get the OAuth access token with the 'oauth_verifier' that we received */
  var oa = new oauth(req.session.oa._requestUrl,
    req.session.oa._accessUrl,
    req.session.oa._consumerKey,
    req.session.oa._consumerSecret,
    req.session.oa._version,
    req.session.oa._authorize_callback,
    req.session.oa._signatureMethod);      
  console.log(oa);
        
  oa.getOAuthAccessToken(
    req.session.oauth_token, 
    req.session.oauth_token_secret, 
    req.param('oauth_verifier'), 
    function(error, oauth_access_token, oauth_access_token_secret, results2) {           
	    if (error) {
	            console.log('error');
	            console.log(error);
	     }
	     else {
        /* Store the access token in the session */
        req.session.oauth_access_token = oauth_access_token;
        req.session.oauth_access_token_secret = oauth_access_token_secret;
        res.redirect((req.param('action') && req.param('action') != "") ? req.param('action') : "/google_user");
     	}
  	});   
});

app.get('/google_user', require_google_login, function(req, res) {
  var oa = new oauth(req.session.oa._requestUrl,
    req.session.oa._accessUrl,
    req.session.oa._consumerKey,
    req.session.oa._consumerSecret,
    req.session.oa._version,
    req.session.oa._authorize_callback,
    req.session.oa._signatureMethod);
  /* Example using GData API v3 */
  /* GData Specific Header */
  oa._headers['GData-Version'] = '3';

  oa.getProtectedResource(
	  "https://www.googleapis.com/userinfo/v2/me",
	  "GET",
	  req.session.oauth_access_token, 
	  req.session.oauth_access_token_secret,
	  function (error, data, response) {      
	    var feed = JSON.parse(data);

	    var shasum = crypto.createHash('md5');
	    shasum.update(feed['email']);

	    res.render('google_user.ejs', {
	      locals: { feed: feed, gravatar: shasum.digest('hex') }
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
  	res.redirect("/google_login");
	else
	  res.redirect("/google_user");
});

/* Start the app */
app.listen(port, host);
console.log('Listening on port ' + port);