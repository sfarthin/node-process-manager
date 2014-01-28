var child_process = require("child_process"),
	_			  = require("underscore"),
	moment 		  = require("moment");

// Based on http://blog.argteam.com/coding/hardening-node-js-for-production-part-3-zero-downtime-deployments-with-nginx/
module.exports = function child(script, env, killTimeoutMS) {
	
	this.script = script;
	this.env = env || {};
	this.killTimeoutMS = killTimeoutMS || (60 * 1000);

	// Colors to display in the console.
	var colors = {
		green: '\033[32m',
		red: '\033[31m',
		blue: '\033[35m',
		yellow: '\033[33m',
		darkblue: '\033[34m',
		grey: '\033[90m',
		reset: '\033[0m',
	}
	
	this.intro = function() {
		return colors.grey + moment().format("YYYY-MM-DD HH:mm:ss") + colors.reset + (this.env.name ? " [" + colors.blue + this.env.name +  colors.reset + "] " : (this.pid ? " [" + colors.blue + this.pid +  colors.reset + "] " : " "));
	}
	
	/**
	*
	* This method spawns or respawns our process, and monitors stdout, sterr and makes sure its running
	*
	**/
	this._spawn = function() {
		
		// This variable indicates whether the process should be running or exiting.
		// If the process exit unexpectantly, we'll restart it.
		this.exiting = false;		
		this.killCallbacks = [];
		
		// process.execPath ... path to node... i.e. /usr/local/Cellar/node/0.10.12/bin/node
		this.child = child_process.spawn(process.execPath, [script], {env: _.extend(process.env, this.env)}) 

		this.pid = this.child.pid;

		// Lets show that we started a child process.
		console.log(this.intro() + colors.green + "Started" + colors.reset + " (" + this.child.pid + ")");

		// Lets relay the console logs.
		this.child.stdout.on("data", function (buf) {
			// @todo consider logging each service
			process.stdout.write(this.intro() + buf);
		}.bind(this));
		
		// Lets relay the error logs.
		this.child.stderr.on("data", function(buf) {
			// @todo consider logging each service
			process.stderr.write(this.intro() + buf);
		}.bind(this));
		
		// Lets respawn the process unless we are in exit mode.
		this.child.on('exit', function(code, signal) {
			
			clearTimeout(this.killTimeout);
			this.child = null;
			
			// If this was an unexpected exit lets respawn.
			if(!this.exiting) {
				console.log(this.intro() + colors.red + "Exited"+colors.reset+(code?" ("+code+")":"") + ", respawning");
				this._spawn();
			} else {
				console.log(this.intro() + colors.red + "Exited"+colors.reset + (code?" ("+code+")":""));
			}
			
			this.pid = null;
			
			// Lets not get in a loop here.
			var funcs = this.killCallbacks;
			this.killCallbacks = [];
			funcs.forEach(function(f) { if(typeof f == "function") f(); });
			
		}.bind(this));
		
		return this;
	}
	
	/**
	*
	* This method will restart the process.
	*
	**/
	this.respawn = function() {

		// If a child exists, lets first kill it before creating another.
		if(this.child) {
			this.kill(this._spawn.bind(this));
		} else {
			this._spawn();
		}
		
	};
	
	/**
	*
	* This method will stop the process from running.
	*
	**/
	this.kill = function(func) {
		
		// Lets keep track of our callbacks and run each and every one of them.
		this.killCallbacks.push(func);
		
		// Lets try to kill this process once.
		if(!this.exiting) {
			this.exiting = true;
		
			// If no argument is given, the process will be sent 'SIGTERM'
			this.child.kill();
		
			// Lets give it 60 seconds, then lets kill it.
			this.killTimeout = setTimeout(function() {
			
				console.error("Child did not exit in time, forcefully killing it")
				
				this.child.kill("SIGKILL");
				this.child = null;
				
				// Lets not get in a loop here.
				var funcs = this.killCallbacks;
				this.killCallbacks = [];
				funcs.forEach(function(f) { if(typeof f == "function") f(); });
			
			}.bind(this), this.killTimeoutMS);
		}
	}
	
	// Lets start by spawning this process.
	this._spawn();
	
	return this;
	
}