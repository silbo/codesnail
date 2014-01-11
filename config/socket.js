/* Add modules */
var fs = require('fs'),
	app = require('../app'),
	db = require('./database'),
	utils = require('./utils'),
	config = require('./config'),
	express = require('express'),
	ss = require('socket.io-stream'),
	io = require('socket.io').listen(app.server),
	passportSocketIo = require('passport.socketio');

io.set('authorization', passportSocketIo.authorize({
	cookieParser: express.cookieParser,
	key: 'connect.sid',
	secret: config.session_secret,
	store: app.SessionStore,
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
/* User initiated socket connection */
io.sockets.on('connection', function(socket) {
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
		},
		code: ""
	};
	/* Update the online users for all users */
	io.sockets.emit("users", onlineUsers);

	/* User asks for someones code */
	socket.on('ping', function() {
		console.log("INFO", "ping received from user:", socket.handshake.user.email);
	});

	/* User asks for someones code */
	socket.on('get-code', function(userEmail) {
		console.log("INFO", "get user code:", userEmail);
		socket.emit("receive-code", onlineUsers[userEmail].code);
	});

	/* User asks for a task */
	socket.on('get-task', function() {
		console.log("INFO", "get task:", socket.handshake.user.email);
		socket.emit("receive-task", utils.getTask());
	});

	/* User verifies a task */
	socket.on('verify-task', function(code) {
		console.log("INFO", "verifiying task:", code.replace(/\s+/g, ''));
		/* Save the users code */
		onlineUsers[socket.handshake.user.email].code = code;
		var prev_task = utils.getTask();
		if (utils.taskComplete(code)) {
			io.sockets.emit("receive-task-verification", socket.handshake.user.name, prev_task.points);
			io.sockets.emit("receive-task", utils.getTask());
			/* Update user points in his session */
			onlineUsers[socket.handshake.user.email].profile.points += prev_task.points;
			/* Update the online users for all users */
			io.sockets.emit("users", onlineUsers);
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
		/* When not a guest user, save the points */
		
	});
});