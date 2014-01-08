var socket = undefined;
var stream = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect('http://www.codesnail.com/profile');
	stream = ss.createStream();

	var box = $('#box');
	box.on('dragenter', doNothing);
	box.on('dragover', doNothing);
	box.text('Drag mugshot here');
	box.on('drop', function(e) {
		e.originalEvent.preventDefault();
		var file = e.originalEvent.dataTransfer.files[0];
		/* Max mugshot size 100KB */
		if (file.size > 100000) {
			$(".messages").html("Mugshot too large");
			return;
		}
		/* Append the file path the the form */
		$('form#profile').append('<input type="hidden" name="mugshot" value="'+file.name+'" />');

		/* Upload a file to the server */
		ss(socket).emit('mugshot', stream, { size: file.size, name: file.name });
		ss.createBlobReadStream(file).pipe(stream);

		/* Show progress */
		ss(socket).on('data', function(message) {
			$('.messages').text(message);
		});
	}); 
};

/* Deal with DOM quirks */
function doNothing (e) {
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