/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

	socket.emit("subscribe", "study");

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

	/* Execute in intervals */
	setInterval(function() {
		/* Send ping to keep connection alive */
		socket.emit("ping");
	}, 10000);

	/* ACE editor initialization */
	$("[id$=example]").each(function() {
		var temp_editor = ace.edit($(this).attr("id"));
		temp_editor.session.setMode("ace/mode/html");
		temp_editor.setOptions({ maxLines: 10, minLines: 1 });
	});
}