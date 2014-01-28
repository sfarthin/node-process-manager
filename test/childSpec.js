var expect = require("chai").expect,
	Process = require("../child.js"),
	intercept = require("../../intercept-stdout/intercept-stdout.js");

describe("Process", function() {
	
	var unhook, 
		captured_stdout = "", 
		process,
		stdoutIntercept,
		filename  = __dirname+"/../example/example1.js",
		filename2 = __dirname+"/../example/example2.js",
		stdout = new (require('events').EventEmitter);
	
	before(function() {
		unhook = intercept(function(str) {
			stdout.emit("stdout", str);
			captured_stdout += str;
		});
	});
	
	after(function() { unhook(); });
	
	it("should startup and function", function(done) {
		this.timeout(500);
		
		expect(Process).to.be.a("function");
	
		process = new Process(filename);
	
		expect(process.child).to.be.a("object");
		
		expect(captured_stdout).to.have.string("Started");
		
		// Lets wait until we see that process shooting stuff out stdout
		stdout.on("stdout", function() {
			if(captured_stdout.match("1\n")) {
				expect(captured_stdout).to.have.string("1\n");
				stdout.removeAllListeners("stdout");
				done();
			}
		});
		
	});
	
	it("can respawn", function(done) {
		this.timeout( 500 );
		
		captured_stdout = "";
		
		process.respawn();
		
		// Lets wait until we see that process started up again, lets make sure it only respawns ONCE.
		stdout.on("stdout", function() {
			if(captured_stdout.match(/Started/)) {
				expect(captured_stdout).to.have.string("Started");
				stdout.removeAllListeners("stdout");
				
				// Lets make sure it only respawned once !!!!
				expect(captured_stdout.match(/Started/gi).length).to.equal(1);
				
				done();
			}
		});
		
	});
	
	it("can be killed", function(done) {
		
		process.kill(function() {
			expect(process.child).to.be.null;
			
			captured_stdout = "";
		
			// Lets wait a little while and make certain the node process is not still running.
			setTimeout(function() {
				expect(captured_stdout).to.equal("");
				done();
			}, 10);
			
		});
		
	});
	
	it("can be created again with a name", function(done) {
		this.timeout(500);
		
		captured_stdout = "";
		
		process = new Process(filename, {name: "Test Name", environmentVar: "Monkey"});
		
		// Lets make sure it contains the name
		expect(captured_stdout).to.have.string("Test Name");
		
		// Lets make sure the environment variables made it to the process, so let wait until it does.
		stdout.on("stdout", function() {
			if(captured_stdout.match("Monkey")) {
				expect(captured_stdout).to.have.string("Monkey");
				stdout.removeAllListeners("stdout");
		
				process.kill(function() {
					expect(process.child).to.be.null;
					done();
				});
			}
		});
		
	});
	
	it("can be respawned and can be seen to be functioning", function(done) {
		this.timeout(500);
		
		captured_stdout = "";
		process.respawn();
		
		expect(process.child).not.to.be.null;
	
		// Lets make sure it indicates the process started.
		expect(captured_stdout).to.have.string("Started");
		
		// Lets make sure it contains the name
		expect(captured_stdout).to.have.string("Test Name");
		
		// Lets wait until we see that process shooting stuff out stdout
		stdout.on("stdout", function() {
			if(captured_stdout.match("1\n")) {
				expect(captured_stdout).to.have.string("1\n");
				stdout.removeAllListeners("stdout");
				done();
			}
		});
		
	});
	
	it("kills the process", function(done) {
	
		process.kill(function() {
		
			captured_stdout = "";
		
			setTimeout(function() {
				expect(captured_stdout).to.equal("");
				done();
			}, 10);
		
		});	
		
	});
	
	it("We can use SIGTERM for graceful shutdown.", function(done) {
		
		captured_stdout = "";
		
		// We user filename2 now... this one looks for SIGTERM
		process = new Process(filename2, {name: "Test SIGTERM", environmentVar: "Squirrel"});
		
		// After we see this thing running, lets kill it and make sure SIGTERM is triggered.
		stdout.on("stdout", function() {
			if(captured_stdout.match("1\n")) {
				stdout.removeAllListeners("stdout");
			
				process.kill(function() {
					expect(captured_stdout).to.have.string("SIGTERM Triggered");
					
					// Lets make sure this only gets triggered once.
					expect(captured_stdout.match(/SIGTERM Triggered/gi).length).to.equal(1);
					
					done();
				});
			}
		});
		
	});
	
	// if("respawns when the process dies unexpectantly", function() {
	// 	
	// 	
	// });
	
});