'use strict';

const path = require("path");
const async = require("async");

//set the logger
const logger = require("../utils/utils.js").getLogger();

const installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));
const serviceModule = require("./service");
const mongoModule = require("./mongo");

const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));

/*
const SOAJS_RMS = {
	'gateway': "soajs.controller",
	'urac': 'soajs.urac',
	'oauth': 'soajs.oauth',
	'multitenant': "soajs.multitenant"
};
*/

function getInstalledVersion() {
	if (installerConfig && installerConfig.version) {
		return installerConfig.version;
	}
	return null;
}

let getEnv = (args, callback) => {
	if (args.length < 1) {
		return callback(`Specify the environment by setting [--env=%env_code%] where you want "soajs services ${process.env.SOAJS_INSTALLER_COMMAND}" to execute`);
	}
	
	//check for environment
	let requestedEnvironment = args[0];
	if (!requestedEnvironment.includes("--env")) {
		return callback(`Specify the environment by setting [--env=%env_code%] where you want "soajs services ${process.env.SOAJS_INSTALLER_COMMAND}" to execute`);
	}
	requestedEnvironment = requestedEnvironment.split("=");
	if (!requestedEnvironment[1] || requestedEnvironment[1] === '') {
		return callback(`Specify the environment by setting [--env=%env_code%] where you want "soajs services ${process.env.SOAJS_INSTALLER_COMMAND}" to execute`);
	}
	requestedEnvironment = requestedEnvironment[1].toLowerCase();
	
	return callback(null, requestedEnvironment);
};

let ifNotSudo = (callback) => {
	if (process.env.PLATFORM === 'Linux' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as Root!\n";
		return callback(output);
	}
	else if (process.env.PLATFORM === 'Darwin' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as: sudo soajs services " + process.env.SOAJS_INSTALLER_COMMAND;
		return callback(output);
	}
};

const servicesModule = {
	
	/**
	 * This function starts all soajs services for a given environment
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'start': (args, callback) => {
		
		ifNotSudo(callback);
		
		let requestedEnvironment = 'dev';
		
		getEnv(args, (error, env) => {
			if (error) {
				return callback(error);
			}
			requestedEnvironment = env;
			
			//check if service is installed and downloaded
			if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
				return callback(`SOAJS Console is not installed!`);
			}
			
			ifNotSudo(callback);
			
			logger.debug("Checking MongoDB Server ....");
			mongoModule.start([], (error) => {
				if (error) {
					return callback(error);
				}
				
				logger.info("Starting all SOAJS Services for " + requestedEnvironment + " Environment ...");
				setTimeout(() => {
					let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
					if (!VERSION_INFO || !VERSION_INFO.services) {
						return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
					}
					async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
						if (oneServiceInfo.type === "any") {
							launchMyService(oneService, (error, response) => {
								if (error) {
									return mCb(error);
								}
								
								if (response && response !== '') {
									logger.debug(response + "\n");
								}
								return mCb(null, true);
							});
						} else {
							return mCb(null, true);
						}
					}, (error) => {
						if (error) {
							return callback("Error starting the SOAJS Services");
						}
						
						logger.info("=========================\nSOAJS Services started!\n=========================\n");
						setTimeout(() => {
							return callback();
						}, 1000);
					});
				}, 1000);
			});
			
			function launchMyService(oneService, mCb) {
				serviceModule.start([oneService, "--env=" + requestedEnvironment], mCb)
			}
		});
	},
	
	/**
	 * This function stops all soajs services for a given environment
	 * @param args
	 * @param callback
	 * @returns {*}
	 */
	'stop': (args, callback) => {
		
		ifNotSudo(callback);
		
		let requestedEnvironment = 'dev';
		
		getEnv(args, (error, env) => {
			if (error) {
				return callback(error);
			}
			requestedEnvironment = env;
			
			//check if service is installed and downloaded
			if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
				return callback(`SOAJS Console is not installed!`);
			}
			
			logger.info("Stopping SOAJS Services for " + requestedEnvironment + " Environment ...");
			setTimeout(() => {
				let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
				if (!VERSION_INFO || !VERSION_INFO.services) {
					return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
				}
				async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
					if (oneServiceInfo.type === "any") {
						launchMyService(oneService, (error, response) => {
							if (error) {
								return mCb(error);
							}
							
							if (response && response !== '') {
								logger.debug(response);
							}
							
							return mCb(null, true);
						});
					} else {
						return mCb(null, true);
					}
				}, (error) => {
					if (error) {
						return callback("Error stopping SOAJS Services");
					}
					
					logger.info("=========================\nSOAJS Services Stopped!\n=========================\n");
					setTimeout(() => {
						return callback();
					}, 1000);
				});
				
			}, 1000);
			
			function launchMyService(oneService, mCb) {
				serviceModule.stop([oneService, "--env=" + requestedEnvironment], mCb)
			}
		});
	},
	
	/**
	 * This function restarts all soajs services for a given environment
	 * @param args
	 * @param callback
	 */
	'restart': (args, callback) => {
		
		ifNotSudo(callback);
		
		let requestedEnvironment = 'dev';
		
		getEnv(args, (error, env) => {
			if (error) {
				return callback(error);
			}
			requestedEnvironment = env;
			
			//check if service is installed and downloaded
			if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
				return callback(`SOAJS Console is not installed!`);
			}
			
			logger.info("Restarting SOAJS Services ...\n");
			setTimeout(() => {
				servicesModule.stop(args, (error) => {
					if (error && error.toString() !== `SOAJS Console is not installed!`) {
						return callback("Unable to Stop the SOAJS Services!");
					}
					
					servicesModule.start(args, (error) => {
						if (error) {
							return callback("Unable to Restart the SOAJS Services!");
						}
						
						return callback(null, "SOAJS Services Restarted!");
					});
				});
			}, 2000);
		});
	},
};

module.exports = servicesModule;