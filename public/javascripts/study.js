/* When DOM has been loaded */
window.onload = function() {
	/* ACE editor initialization */
	$("[id$=code]").each(function() {
		editor = ace.edit($(this).attr('id'));
		editor.session.setMode("ace/mode/html");
		editor.setOptions({ maxLines: 10, minLines: 1 });
	});
}