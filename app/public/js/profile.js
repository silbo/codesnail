var socket = undefined;
var stream = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();
	stream = ss.createStream();

	var box = $("#mugshot-box");
	box.on("dragenter", doNothing);
	box.on("dragover", doNothing);
	/* Dehighlight input box */
	box.on("dragleave drop", function() {
		$("#mugshot-box").removeClass("mugshot-box"); 
	});
	box.text("Drag mugshot here");
	box.on("drop", function(e) {
		e.originalEvent.preventDefault();
		var file = e.originalEvent.dataTransfer.files[0];

		/* Upload a file to the server */
		ss(socket).emit("mugshot", stream, { size: file.size, name: file.name });
		ss.createBlobReadStream(file).pipe(stream);

		/* Show error message */
		ss(socket).on("error-message", function(error) {
			$("#forErrors").append('<p class="alert alert-error">' + error + '</p>');
		});

		/* Show success message */
		ss(socket).on("message", function(message) {
			$("#forErrors").append('<p class="alert alert-success">' + message + '</p>');
			/* Append the file path the the form */
			$("form#profile").append('<input type="hidden" name="mugshot" value="'+file.name+'" />');
		});
	}); 
};

/* Deal with DOM quirks */
function doNothing(e) {
	/* Highlight input box */
	$("#mugshot-box").addClass("mugshot-box");
	e.preventDefault();
	e.stopPropagation();
}

window.addEventListener("dragover", function(e) {
	e = e || event;
	e.preventDefault();
},false);

window.addEventListener("drop", function(e) {
	e = e || event;
	e.preventDefault();
},false);