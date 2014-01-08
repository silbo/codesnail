#!/bin/env node

/* Add modules */
var express = require('express'),
	expressValidator = require('express-validator'),
	app = express(),
	jade = require('jade'),
	flash = require('connect-flash'),
	http = require('http'),
	passport = require('passport'),
	auth = require("./config/authentication"),
	db = require("./config/database"),
	MongoStore = require('connect-mongo')(express),
	config = require("./config/config"),
	email = require("./config/email"),
	routes = require('./routes'),
	user = require('./routes/user');

var SessionStore = new MongoStore({ url: config.database_url });
/* Set app properties */
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.multipart());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.logger('dev'));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
	secret: "super-secret-u-will-never-guess",
	store: SessionStore
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

app.get("/login", auth.checkLogin, user.login);
app.all("/register", auth.checkLogin, user.register);
app.get("/register/:id", auth.checkLogin, user.verify);
app.all("/forgot", auth.checkLogin, user.forgotPassword);
app.get("/study", routes.study);
app.get("/coding", routes.coding);

app.post("/login", passport.authenticate("local", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.google.auth, passport.authenticate("google", { scope: config.google.gdata_scopes }));
app.get(config.google.callback, passport.authenticate("google", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.twitter.auth, passport.authenticate("twitter"));
app.get(config.twitter.callback, passport.authenticate("twitter", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

/* Facebook Oauth2 bug appends #_=_ to the callback URL */
app.get(config.facebook.auth, passport.authenticate("facebook", { scope: ['email'] }));
app.get(config.facebook.callback, passport.authenticate("facebook", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.linkedin.auth, passport.authenticate("linkedin", { scope: ['r_basicprofile', 'r_emailaddress'] }));
app.get(config.linkedin.callback, passport.authenticate("linkedin", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get(config.github.auth, passport.authenticate("github"));
app.get(config.github.callback, passport.authenticate("github", { successRedirect: "/profile", failureRedirect: "/login", failureFlash: true }));

app.get("/logout", user.logout);

/* Homepage */
app.get("/", auth.ensureAuthenticated, routes.index);

/* Profile page */
app.get("/profile", auth.ensureAuthenticated, user.profile);
app.post("/profile/update", auth.ensureAuthenticated, user.profileUpdate);
app.post("/profile/password", auth.ensureAuthenticated, user.passwordUpdate);
app.get("/profile/mugshot/:provider", auth.ensureAuthenticated, user.mugshotUpdate);
app.get("/profile/remove/:name", auth.ensureAuthenticated, user.providerRemove);

/* Delete all the users and providers */
if (false) {
	db.User.remove(function (err, removed) {
		if (err) console.log("ERROR", "deleting all users:", err);
		else console.log("INFO", "successfully removed all users");
	});
	db.Provider.remove(function (err, removed) {
		if (err) console.log("ERROR", "deleting all providers:", err);
		else console.log("INFO", "successfully removed all providers");
	});
}

/* Show all the users and providers */
db.User.find(function (err, users) {
	if (err) console.log("ERROR", "fetching all users:", err);
	else users.forEach(function(user) {
		console.log("INFO", "user name:", user.name);
	});
});
db.Provider.find(function (err, providers) {
	if (err) console.log("ERROR", "fetching all providers:", err);
	else providers.forEach(function(provider) {
		console.log("INFO", "provider url:", provider.url);
	});
});

/* Start the app */
var server = http.createServer(app).listen(config.port);
console.log("INFO", "express server listening on port:", config.port);

/* Setup socket sessionstore */
var io = require('socket.io').listen(server);
/* Configure timeout */
io.configure( function() {
    io.set('close timeout', 60); // 60 sec time out
});

var passportSocketIo = require('passport.socketio');
io.set('authorization', passportSocketIo.authorize({
	cookieParser: express.cookieParser,
	key: 'connect.sid',
	secret: 'super-secret-u-will-never-guess',
	store: SessionStore,
	fail: function(data, accept) {
		console.log("ERROR", "scoket data:", data);
		accept(null, false);
	},
	success: function(data, accept) {
		//console.log("INFO", "scoket:", data);
		accept(null, true);
	}
}));

/* Online users */
var onlineUsers = {};
var currentTask = 0;
var task = [
	"Task 1: Create a basic html structure with head and body",
	"Task 2: Add a header 1 with text 'Awesome' inside the body",
	"Task 3: Add two paragraph under the header 1, the first with text 'Cool' and second with text 'Interesting'",
	"Task 4: Add a link with text 'My Website' and link 'http://www.mywebsite.com', after the paragraphs"];
var taskVerify = [
	'<html(.*)><head>(.*)</head><body></body></html>',
	'<html(.*)><head>(.*)</head><body><h1>Awesome</h1></body></html>',
	'<html(.*)><head>(.*)</head><body><h1>Awesome</h1><p>Cool</p><p>Interesting</p></body></html>',
	'<html(.*)><head>(.*)</head><body><h1>Awesome</h1><p>Cool</p><p>Interesting</p><ahref="http://www.mywebsite.com">MyWebsite</a></body></html>'];
/* User initiated socket connection */
io.sockets.on('connection', function (socket) {
	/* Add user to online users */
	console.log("INFO", "socket connection established");
	console.log("INFO", "socket user:", socket.handshake.user.email);
	onlineUsers[socket.handshake.user.email] = {
		name: socket.handshake.user.name,
		email: socket.handshake.user.email,
		profile: {
			mugshot: socket.handshake.user.profile.mugshot,
			website: socket.handshake.user.profile.website,
			description: socket.handshake.user.profile.description
		}
	};
	/* Update the online users for all users */
	io.sockets.emit("users", onlineUsers);

	/* User asks for someones code */
	socket.on('get-code', function(userEmail) {
		console.log("INFO", "get user code:", userEmail);
		socket.emit("receive-code", onlineUsers[userEmail].code);
	});

	/* User asks for a task */
	socket.on('get-task', function() {
		console.log("INFO", "get task:", socket.handshake.user.email);
		socket.emit("receive-task", task[currentTask]);
	});

	/* User verifies a task */
	socket.on('verify-task', function(code) {
		console.log("INFO", "verifiying task:", code.replace(/\s+/g, ''));
		/* Save the users code */
		onlineUsers[socket.handshake.user.email].code = code;
		if (code.replace(/\s+/g, '').match(taskVerify[currentTask])) {
			io.sockets.emit("receive-task-verification", socket.handshake.user.name + " Wins!");
			/* Update the current task */
			currentTask = (currentTask + 1) % task.length;
			io.sockets.emit("receive-task", task[currentTask]);
		}
		else
			io.sockets.emit("receive-task-verification", "");
	});

	/* User disconnected from socket */
	socket.on('disconnect', function() {
		console.log("INFO", "socket user disconnected:", socket.handshake.user.email);
		/* Delete user from online users */
		delete onlineUsers[socket.handshake.user.email];
		/* Update the online users for all users */
		io.sockets.emit("users", onlineUsers);
		/* Try to reconnect */

	});
});
