var socket = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

	socket.emit("subscribe", "dashboard");

	/* Aquire all the users */
	socket.on("users", function(users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Show the room name */
        $("#room").html("(in room dashboard)");
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html( $("#online-users").html() + 
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
}