#!/bin/env node

/* Add modules */
var express = require('express'),
	app = express(),
	fs = require('fs'),
	http = require('http'),
	jade = require('jade'),
	routes = require('./routes'),
	passport = require('passport'),
	user = require('./routes/user'),
	flash = require('connect-flash'),
	email = require("./config/email"),
	db = require("./config/database"),
	config = require("./config/config"),
	auth = require("./config/authentication"),
	MongoStore = require('connect-mongo')(express),
	expressValidator = require('express-validator');

var SessionStore = new MongoStore({ url: config.database_url });
/* Set app properties */
app.set('view engine', 'jade');
app.use(express.static(__dirname + "/public"));
app.use(express.json());
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

app.get("/study", routes.study);
app.get("/coding", routes.coding);
app.get("/sumorobot", routes.sumorobot);
app.get("/login", auth.checkLogin, user.login);
app.all("/register", auth.checkLogin, user.register);
app.get("/register/:id", auth.checkLogin, user.verify);
app.all("/forgot", auth.checkLogin, user.forgotPassword);

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
app.get("/profile/remove/:name", auth.ensureAuthenticated, user.providerRemove);
app.get("/profile/mugshot/:provider", auth.ensureAuthenticated, user.mugshotUpdate);

/* Delete all the users and providers and tasks */
if (false) {
	db.User.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all users:", err);
		else console.log("INFO", "successfully removed all users");
	});
	db.Provider.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all providers:", err);
		else console.log("INFO", "successfully removed all providers");
	});
	db.Task.remove(function(err, removed) {
		if (err) console.log("ERROR", "deleting all tasks:", err);
		else console.log("INFO", "successfully removed all tasks");
	});
}

/* Show all the users and providers and tasks */
db.User.find(function(err, users) {
	if (err) console.log("ERROR", "fetching all users:", err);
	else users.forEach(function(user) {
		console.log("INFO", "user name:", user.name);
	});
});
db.Provider.find(function(err, providers) {
	if (err) console.log("ERROR", "fetching all providers:", err);
	else providers.forEach(function(provider) {
		console.log("INFO", "provider url:", provider.url);
	});
});
db.Task.find(function(err, tasks) {
	if (err) console.log("ERROR", "fetching all tasks:", err);
	else tasks.forEach(function(task) {
		console.log("INFO", "task:", task.name);
	});
});

/* Start the app */
var server = http.createServer(app).listen(config.port);
console.log("INFO", "express server listening on port:", config.port);

/* Setup socket sessionstore */
var io = require('socket.io').listen(server);
var ss = require('socket.io-stream');

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

var tasks = [];
var currentTask = 0;

/* Fetch all tasks */
db.Task.find(function(err, db_tasks) {
	if (err) console.log("ERROR", "fetching all tasks:", err);
	else tasks = db_tasks;
});

/* Get new task */
function getTask() {
	if (tasks.length == 0) return "Currently no tasks available";
	return "Task " + (currentTask+1) + ": " + tasks[currentTask].name;
}

/* Check if task is complete */
function taskComplete(code) {
	if (tasks.length == 0) return false;
	/* When task was completed */
	if (code.replace(/\s+/g, '').match(tasks[currentTask].verification)) {
		currentTask = (currentTask + 1) % tasks.length;
		return true;
	}
	return false;
}

/* Online users */
var onlineUsers = {};
/* User initiated socket connection */
io.sockets.on('connection', function (socket) {
	/* Add user to online users */
	console.log("INFO", "socket connection established");
	console.log("INFO", "socket user:", socket.handshake.user.email);
	socket.heartbeatTimeout = 5000;
	onlineUsers[socket.handshake.user.email] = {
		name: socket.handshake.user.name,
		email: socket.handshake.user.email,
		profile: {
			points: socket.handshake.user.profile.points,
			mugshot: socket.handshake.user.profile.mugshot,
			website: socket.handshake.user.profile.website,
			description: socket.handshake.user.profile.description
		}
	};
	/* Update the online users for all users */
	io.sockets.emit("users", onlineUsers);

	/* User asks for someones code */
	socket.on('ping', function() {
		console.log("INFO", "ping received from user:", socket.handshake.user.name);
	});

	/* User asks for someones code */
	socket.on('get-code', function(userEmail) {
		console.log("INFO", "get user code:", userEmail);
		socket.emit("receive-code", onlineUsers[userEmail].code);
	});

	/* User asks for a task */
	socket.on('get-task', function() {
		console.log("INFO", "get task:", socket.handshake.user.email);
		socket.emit("receive-task", getTask());
	});

	/* User verifies a task */
	socket.on('verify-task', function(code) {
		console.log("INFO", "verifiying task:", code.replace(/\s+/g, ''));
		/* Save the users code */
		onlineUsers[socket.handshake.user.email].code = code;
		if (taskComplete(code)) {
			io.sockets.emit("receive-task-verification", socket.handshake.user.name);
			io.sockets.emit("receive-task", getTask());
		}
		else
			io.sockets.emit("receive-task-verification", "");
	});

	/* To stream mugshot to the server */
	ss(socket).on('mugshot', function(stream, meta) {
		console.log("INFO", "incoming stream size:", meta.size, meta.name)
		/* Drop the stream if the file is too large max 100KB allowed */
		if (meta.size > 100000) return;
		stream.pipe(fs.createWriteStream(__dirname + '/public/images/' + meta.name));
		// Send progress back
		ss(socket).emit('data', "Mugshot uploaded, click save to update");
	});

	/* User disconnected from socket */
	socket.on('disconnect', function() {
		console.log("INFO", "socket user disconnected:", socket.handshake.user.email);
		/* Delete user from online users */
		delete onlineUsers[socket.handshake.user.email];
		/* Update the online users for all users */
		io.sockets.emit("users", onlineUsers);
		/* TODO: Try to reconnect */
	});
});