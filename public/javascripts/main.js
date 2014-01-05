var socket = undefined;
var editor = undefined;
var oldCode = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

	/* Aquire all the users */
	socket.on("users", function (users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html( $("#online-users").html() + '<div class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
			'<a class="mugshot-link" href="#" title="show code">' +
			'<img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" />' +
			'<p>' + users[key].name + '</p><p>' + users[key].profile.description + '</p></a></div>');
		}
	});

	/* Receive the requested users code */
	socket.on("receive-code", function (code) {
		editor.setValue(code);
	});

	/* Receive the requested task */
	socket.on("receive-task", function (task) {
		$("#task").html("<p>" + task + "</p>");
	});

	/* Receive the requested task */
	socket.on("receive-task-verification", function (message) {
		if (message) {
			$("#task-message").slideDown("fast")
			$("#task-message").html(message);
			setTimeout(function() { $("#task-message").slideUp("fast"); }, 1000);
		}
	});

	/* Get the task */
	socket.emit("get-task");

	/* Execute in intervals */
	setInterval(function() {
		var code = editor.getValue();
		/* When the users code has changed */
		if (oldCode != code)
			/* Send it for verification */
			socket.emit("verify-task", editor.getValue())
		oldCode = code;
	}, 1000);

	/* ACE editor initialization */
	editor = ace.edit("code");
	editor.session.setMode("ace/mode/html");
	editor.setOptions({ maxLines: 10, minLines: 10 });
	editor.setAutoScrollEditorIntoView(true);

	/* Load emmet for fast coding */
	ace.config.loadModule("ace/ext/emmet", function() {
		ace.require("ace/lib/net").loadScript("http://nightwing.github.io/emmet-core/emmet.js", function() {
			editor.setOption("enableEmmet", true);
		});

		editor.setOptions({
			enableSnippets: true,
			enableBasicAutocompletion: true
		});
	});

	/* Enable autocomplete */
	ace.config.loadModule("ace/ext/language_tools", function() {
		editor.setOptions({
			enableSnippets: true,
			enableBasicAutocompletion: true
		});
	});
}

/* Get a users code */
function getCode(userEmail) {
	socket.emit("get-code", userEmail);
}

/* Send users code */
function setCode() {
	socket.emit("set-code", editor.getValue());
}