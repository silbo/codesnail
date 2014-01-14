var editor = undefined;
var oldCode = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();

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

	/* Receive the requested users code */
	socket.on("receive-code", function(code) {
		editor.setValue(code, 1);
	});

	/* Execute when user types */
	$("#code").keydown(function() {
		/* Send the code to other users */
		socket.emit("share-code", editor.getValue());
	});

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

	/* ACE editor initialization */
	$("[id$=example]").each(function() {
		var temp_editor = ace.edit($(this).attr("id"));
		temp_editor.session.setMode("ace/mode/html");
		temp_editor.setOptions({ maxLines: 10, minLines: 1 });
	});
}