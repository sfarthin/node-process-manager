var counter = 0;
setInterval(function() {
	console.log(++counter);
	console.log(process.env.environmentVar);
}, 1);