process.on("SIGTERM", function() {
	console.log("SIGTERM Triggered");
	process.exit();
});

var counter = 0;
setInterval(function() {
	console.log(++counter);
}, 1);