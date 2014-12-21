/* Add modules */
var fs = require('fs'),
    app = require('../app'),
    db = require('./database'),
    utils = require('./utils'),
    uuid = require('node-uuid'),
    config = require('./config'),
    ss = require('socket.io-stream'),
    exec = require('child_process').exec,
    cookieParser = require('cookie-parser'),
    io = require('socket.io').listen(app.server),
    passportSocketIo = require('passport.socketio');

//io.set('log level', 1);
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'connect.sid',
    secret: config.session_secret,
    store: app.SessionStore,
    fail: function(data, message, error, accept) {
        console.log("ERROR", "scoket message:", message, "error:", error);
        if(error) throw new Error(message);
        return accept();
    },
    success: function(data, accept) {
        //console.log("INFO", "scoket:", data);
        return accept();
    }
}));

/* Online users */
var onlineUsers = { 'dashboard': {}, 'study': {}, 'coding': {}, 'chat': {}, 'sumorobot': {}, 'games': {} };
var sockUsers = [];
var eSocks = [];

/* User initiated socket connection */
io.sockets.on('connection', function(socket) {

    /* User connected to socketio */
	console.log("INFO", "socket connection established");
	console.log("INFO", "socket user:", socket.request.user.email);
	socket.heartbeatTimeout = 5000;
	sockUsers[socket.request.user.email] = socket;

	/* Subscribing and unsubscribing to rooms */
	socket.on('subscribe', function(room) {
		socket.join(room);
		/* Add the user to the room he/she is now */
		onlineUsers[room][socket.request.user.email] = {
			name: socket.request.user.name,
			email: socket.request.user.email,
			profile: {
				points: socket.request.user.profile.points,
				mugshot: socket.request.user.profile.mugshot,
				description: socket.request.user.profile.description
			}
		};
		/* Update the online users for every user in this room */
		io.sockets.to(room).emit('users', onlineUsers[room]);
		console.log("INFO", "online users:", onlineUsers);
	});

	/* User sends ping */
	socket.on('ping', function() {
		console.log("INFO", "ping received from user:", socket.request.user.email);
	});

	/* User asks for someones code */
	socket.on('get-code', function(room, userEmail) {
		console.log("INFO", "get user code:", userEmail);
		socket.emit('receive-code', onlineUsers[room][userEmail].code);
	});

	/* User shares his/her code */
	socket.on('share-code', function(room, code) {
		console.log("INFO", "share user code:", socket.request.user.email);
		socket.broadcast.to(room).emit('receive-code', code);
	});

	/* User shares his/her chat */
	socket.on('share-chat', function(room, chat) {
		console.log("INFO", "user chat:", socket.request.user.email);
		io.sockets.to(room).emit('receive-chat', socket.request.user.name, chat);
	});

	/* User asks for a task */
	socket.on('get-task', function() {
		console.log("INFO", "get task:", socket.request.user.email);
		socket.emit('receive-task', utils.getTask());
	});

	/* User verifies a task */
	socket.on('verify-task', function(room, code) {
		console.log("INFO", "verifiying task:", code.replace(/\s+/g, ''));
		/* Save the users code */
		onlineUsers[room][socket.request.user.email].code = code;
		var prev_task = utils.getTask();
		/* Check if task has been completed */
		if (utils.taskComplete(code)) {
			/* Send the winner to everyone in the room and update their task */
			io.sockets.to(room).emit('receive-task-verification', socket.request.user.name, prev_task.points);
			io.sockets.to(room).emit('receive-task', utils.getTask());
			/* Update user points in his session */
			onlineUsers[room][socket.request.user.email].profile.points += prev_task.points;
			/* Update the online users for all users */
			io.sockets.to(room).emit('users', onlineUsers[room]);
		}
	});

	/* Send back the data for the user that this socket belongs to */
    socket.on('sendCurrentUser', function(data) {
        var cuser = {
            email: socket.request.user.email,
            name: socket.request.user.name,
            profile: {
                points: socket.request.user.profile.points,
                mugshot: socket.request.user.profile.mugshot,
                description: socket.request.user.profile.description
            }
        }
        socket.emit('currentUser', {user: cuser});
    });

    /* Send a exclusive invitation for the selected user */
    socket.on('sendExclusiveInvite', function(data) {
        try {
            var newSockAdd = uuid.v1();
            eSocks.push(newSockAdd);
            sockUsers[data.email].emit('exclusiveInvite', {email: socket.request.user.email, newSockAdd: newSockAdd});
        } catch (error) {
            console.log("WARN", "error", error);
        }
    });

    /* Send the exclusive invitation response back */
    socket.on('eInviteResponse', function(data) {
        if (data.accepted) {
            //start listening on new connection
            //only if(data.newSockadd is in esocket)
            //also check if its already in Ecode withsomeone
            startECodeServer(data.newSockAdd,data.email,socket.request.user.email);
            sockUsers[data.email].emit('initiateECode', { on: data.newSockAdd });
            socket.emit('initiateECode', { on: data.newSockAdd });
        } else {
            //delete newsockadd
            sockUsers[data.email].emit('rejectedECodeInvitation', {});
        }
    });

	/* User send sumorobot code */
	socket.on('send-sumorobot-code', function(code) {
		console.log("INFO", "sumorobot code:", code);
		/* Add sumorobot libraries */
		code = "#include <Servo.h>\n#include <Sumorobot.h>\n" + code;
		/* Write the program to the file */
		fs.writeFile("public/compiler/main.ino", code, function(err) {
			if (err) return new Error(err);
			else console.log("INFO", "sumorobot code was saved");
		});
		/* Compile the program */
		var child = exec("cd public/compiler && make all && make upload",
			function (error, stdout, stderr) {
				console.log("INFO", "stdout:", stdout);
				console.log("INFO", "stderr:", stderr);
				if (error !== null) return new Error(error);
			}
		);
	});

	/* To stream mugshot to the server */
	ss(socket).on('mugshot', function(stream, meta) {
		console.log("INFO", "incoming stream size:", meta.size, meta.name)
		/* Drop the stream if the file is too large max 100KB allowed */
		if (meta.size > 100000) {
			ss(socket).emit('error-message', "Mugshot too large, max 100KB allowed");
			return;
		}
		stream.pipe(fs.createWriteStream("public/images/" + meta.name));
		// Send progress back
		ss(socket).emit('message', "Mugshot uploaded successfully, click save to update");
	});

	/* User disconnected from socket */
	socket.on('disconnect', function() {
		console.log("INFO", "socket user disconnected:", socket.request.user.email);
		/* Save user points to his/her session */
		if (onlineUsers['coding'][socket.request.user.email]) {
			var sessionID = socket.request.sessionID;
			var points = onlineUsers['coding'][socket.request.user.email].profile.points;
			app.SessionStore.get(sessionID, function(err, session) {
				if (!err && session) {
					session.passport.user.profile.points = points;
					app.SessionStore.set(sessionID, session);
					console.log ("INFO", "successfully saved user points");
				} else {
					console.log ("ERROR", "saving user points");
				}
			});
			/* When not a guest user */
			if (socket.request.user.name.indexOf("Guest") == -1) {
				db.User.findOne({ email: socket.request.user.email }, function(err, user) {
					if (err) return new Error(err);
					else {
						user.profile.points = points;
						user.save();
					}
				});
			}
		}
		/* Delete user from from every room, do not know where he is :P */
		/* Update the online users for all users in every room */
		for (var room in onlineUsers) {
			delete onlineUsers[room][socket.request.user.email];
			io.sockets.to(room).emit('users', onlineUsers[room]);
		}
		/* TODO: When not a guest user, save the points */
	});
});

/* Start separate sockets for the exclusive coding */
function startECodeServer(on, pe1, pe2) {
	var etasks = utils.getTasks();
	var currenteTask = 0;

	/* Get new task */
	function geteTask() {
		if (etasks.length == 0) return { name: "Currently no tasks available" };
		if (etasks.length == currenteTask) return { name: "Done" };
		return { name: "Task " + (currenteTask + 1) + ": " + etasks[currenteTask].name, points: etasks[currenteTask].points };
	}

	/* Check if task is complete */
	function taskeComplete(code) {
		if (etasks.length == 0) return false;
		/* When task was completed */
		if (code.replace(/\s+/g, '').match(etasks[currenteTask].verification)) {
			currenteTask += 1;
			return true;
		}
		return false;
	}

	var p1 = { email: pe1, code: "", socket: null, score: 0 };
	var p2 = { email: pe2, code: "", socket: null, score: 0 };
	var currentP = undefined;

	var eSock = io.of('/' + on).on('connection', function (socket) {
		//console.log("Threat detected")
		if (socket.request.user.email == p1.email) {
			p1.socket = socket;
		} else {
			p2.socket = socket;
		}
		/* User asks for a task */
		socket.on('get-etask', function() {
			console.log("INFO", "get etask:", socket.request.user.email);
			socket.emit('receive-etask', geteTask());
			//p2.socket.emit('receive-etask', utils.getTask());
		});
		socket.on('recieveClientCode', function(data) {
			if (socket.request.user.email == p1.email) {
				currentP = p1;
				p1.code = data.code;
				p2.socket.emit('p2Status', { code: data.code });
				console.log("INFO", "emitted to:", p2.email);
			} else {
				currentP = p2;
				p2.code = data.code;
				p1.socket.emit('p2Status', { code: data.code });
				console.log("INFO", "emitted to:", p1.email);
			}
			console.log("INFO", "verifiying task:", data.code.replace(/\s+/g, ''));
			/* Save the users code */
			var prev_task = geteTask();
			/* Check if task has been completed */
			if (taskeComplete(data.code)) {
				console.log("INFO", "task completed");
				/* Send the winner to everyone in the room and update their task */
				p1.socket.emit('receive-etask-verification', socket.request.user.name, prev_task.points);
				p2.socket.emit('receive-etask-verification', socket.request.user.name, prev_task.points);
				currentP.score += prev_task.points;
				if (geteTask().name == "Done") {
					var winner = undefined;
					if (p1.score > p2.score) winner = p1.email;
					else winner = p2.email;
					p1.socket.emit('eCode-done', winner);
					p2.socket.emit('eCode-done', winner);
				} else {
					p1.socket.emit('receive-etask', geteTask());
					p2.socket.emit('receive-etask', geteTask());
				}
				/* Update user points in his session */
				//onlineUsers[room][socket.request.user.email].profile.points += prev_task.points;
				/* Update the online users for all users */
				//io.sockets.to(room).emit('users', onlineUsers[room]);
			}
		});
	});
}