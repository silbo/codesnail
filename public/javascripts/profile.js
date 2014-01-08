/* Start the fileserver */
var client = new BinaryClient('ws://localhost:9000');

// Wait for connection to BinaryJS server
client.on('open', function() {
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
		/* `client.send` is a helper function that creates a stream with the */
		/* given metadata, and then chunks up and streams the data. */
		/* Append the file path the the form */
		$('form#profile').append('<input type="hidden" hidden="hidden" name="mugshot" value="'+file.name+'" />');
		var stream = client.send(file, { name: file.name, size: file.size });
		/* Print progress */
		var tx = 0;
		stream.on('data', function(data) {
			$('#progress').text(Math.round(tx+=data.rx*100) + '% complete');
		});
	}); 
});

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