"use strict";

//const bunyan = require("bunyan");
//const bunyanFormat = require('bunyan-format');
const soajs = require('soajs');

module.exports = {
	"getLogger": () => {
		return soajs.core.getLogger("SOAJS Installer", {"formatter": {"levelInString": true, "outputMode": 'short'}, "level": "debug"});
		/*
		//set the logger
		let formatOut = bunyanFormat({"levelInString": true, "outputMode": 'short'});
		const logger = bunyan.createLogger({
			name: "SOAJS Installer",
			"src": true,
			"level": "debug",
			"stream": (process.env.SOAJS_CONSOLE) ? null : formatOut
		});
		
		return logger;
		*/
	}
};