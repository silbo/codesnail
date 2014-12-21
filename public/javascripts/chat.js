var editor = undefined;

/* When DOM has been loaded */
window.onload = function() {
    var contents = $('iframe').contents(),
    ifbody = contents.find('body')

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
			'<center><img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" /></center>' +
			'<p>' + users[key].name + '</p><p>points: ' + users[key].profile.points + '</p></a></div>');
		}
	});

	/* Receive shared chat */
	socket.on("receive-chat", function(userName, chat) {
        notifySound(); //played twice ignore if from current user
		$("#chat").append(userName + ": " + chat + "\n");
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
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
	//editor.setTheme("ace/theme/monokai");
	editor.session.setMode("ace/mode/html");
	editor.setOptions({ maxLines: 20, minLines: 20 });
	editor.setAutoScrollEditorIntoView(true);

    editor.on("change", function(obj) {
        ifbody.html(editor.getValue());
    });

    /* sharejs stuff */
    var sucket = new BCSocket(null, {reconnect: true});
    var sjs = new sharejs.Connection(sucket);
    var doc = sjs.get('docs', 'hello');
    // Subscribe to changes
    doc.subscribe();
    // This will be called when we have a live copy of the server's data.
    doc.whenReady(function() {
        console.log('doc ready, data: ', doc.getSnapshot());
        if (!doc.type) doc.create('text');
        doc.attach_ace(editor);
    });
}
