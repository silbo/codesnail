var editor = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

	socket.emit("subscribe", "chat");

	/* Aquire all the users */
	socket.on("users", function(users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html($("#online-users").html() + 
			'<div id="'+users[key].name.replace(/ /g, "")+'" class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
			'<a class="mugshot-link" href="#" title="show code">' +
			'<img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" />' +
			'<p>' + users[key].name + '</p><p>points: ' + users[key].profile.points + '</p></a></div>');
		}
	});

	/* Receive shared code */
	socket.on("receive-code", function(code) {
		editor.setValue(code, 1);
	});

	/* Receive shared chat */
	socket.on("receive-chat", function(userName, chat) {
		$("#chat").append(userName + ": " + chat + "\n");
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
	});

	/* Execute when user types */
	$("#code").keydown(function() {
		/* Send the code to other users */
		socket.emit("share-code", "chat", editor.getValue());
	});

	/* Execute when user presses enter */
	$("#message").keypress(function(e) {
		if(e.which == 13) {
			/* Send the chat to other users */
			socket.emit("share-chat", "chat", $("#message").val());
			/* Clear the message field and blur the submit button */
			$("#submit-chat").blur();
			$("#message").val("");
		}
	});

	/* Execute when user clicks send */
	$("#submit-chat").click(function() {
		/* Send the chat to other users */
		socket.emit("share-chat", "chat", $("#message").val());
		/* Clear the message field and blur the submit button */
		$("#submit-chat").blur();
		$("#message").val("");
	});

	/* Execute in intervals */
	setInterval(function() {
		/* Send ping to keep connection alive */
		socket.emit("ping");
	}, 10000);

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