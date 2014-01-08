var socket = undefined;
var oldCode = undefined;

/* When DOM has been loaded */
window.onload = function() {
	// initialize blockly
	Blockly.inject(document.getElementById('blocklyDiv'), { path: '/blockly/', toolbox: document.getElementById('toolbox') });

	socket = io.connect();

	/* Aquire all the users */
	socket.on("users", function (users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html( $("#online-users").html() + 
			'<div id="'+users[key].name.replace(/ /g, "")+'" class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
			'<a class="mugshot-link" href="#" title="show code">' +
			'<img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" />' +
			'<p>' + users[key].name + '</p><p>' + users[key].profile.description + '</p></a></div>');
		}
	});

	/* Receive the requested users code */
	socket.on("receive-code", function (code) {
		//editor_other.setValue(code);
		//$("#code-message").slideDown("fast")
		//setTimeout(function() { $("#code-message").slideUp("fast"); }, 2000);
	});

	/* Execute in intervals */
	setInterval(function() {
		/* Send ping to keep connection alive */
		socket.emit("ping");
	}, 10000);
}

/* Get a users code */
function getCode(userEmail) {
	socket.emit("get-code", userEmail);
}

function showCode() {
	var code = Blockly.Generator.workspaceToCode('JavaScript');
	alert(code);
}