# Node.js Process Manager

Simple Node Process Manager with graceful shutdown. This tool will automatically restart processes when they exit unexpectedly.

## Installation

	npm install node-process-manager

## Usage

example-webserver.js

	var http = require('http');
	var server = http.createServer(function (req, res) {
	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end('Hello World\n');
	});
	...
	server.listen(1337, '127.0.0.1');
	
	// Graceful Shutdown. Close connections, etc...
	process.on("SIGTERM", function() {
		server.close();
		...
		process.exit();
	});

manager.js

	var Manager = require("node-process-manager");

	var process1 = new Manager("/path/to/express/example-webserver.js"),
		process2 = new Manager("/path/to/express/example-webserver2.js", {
			name: "My Webserver", 
			environmentVar: "The child process can access this variable via process.env.environmentVar"
		});

	// Restart a process.
	process2.respawn();

	// Kill a Process
	process1.kill();

Starting the process manager

	nohup node manager.js > "/var/log/node.log" &

See [test/childSpec](https://github.com/sfarthin/node-process-manager/blob/master/test/childSpec.js) for more detailed usage.

## Test

	npm install mocha -g
	mocha