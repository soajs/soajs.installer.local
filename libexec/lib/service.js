"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const path = require("path");
const fs = require("fs");
const spawn = require("child_process").spawn;
const exec = require("child_process").exec;

const mkdirp = require("mkdirp");

const installer = require("./installer.js");
//set the logger
const logger = require("../utils/utils.js").getLogger();

const mongo_module = require("./mongo.js");

const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));

const installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));

function getInstalledVersion() {
	if (installerConfig && installerConfig.version) {
		return installerConfig.version;
	}
	return null;
}

/**
 * Check if the requested service in the requested environment has a running process
 * @param requestedService
 * @param requestedEnvironment
 * @param callback
 */
function checkIfServiceIsRunning(requestedService, requestedEnvironment, callback) {
	//check if there is a running process for the requested
	let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
	if (!VERSION_INFO || !VERSION_INFO.services || !VERSION_INFO.services[requestedService]) {
		return callback(false);
	}
	exec(`ps aux | grep ${VERSION_INFO.services[requestedService].repo}`, (error, cmdOutput) => {
		if (error || !cmdOutput) {
			return callback(false);
		}
		
		//go through the returned output and find the process ID
		cmdOutput = cmdOutput.split("\n");
		if (Array.isArray(cmdOutput) && cmdOutput.length > 0) {
			let PID = null;
			cmdOutput.forEach((oneCMDLine) => {
				
				if (!oneCMDLine.includes("grep")) {
					if (requestedService === 'ui') {
						if (oneCMDLine.includes(VERSION_INFO.services.ui.repo)) {
							let oneProcess = oneCMDLine.replace(/\s+/g, ' ').split(' ');
							PID = oneProcess[1];
						}
					}
					else {
						if (oneCMDLine.includes(VERSION_INFO.services[requestedService].repo) && oneCMDLine.includes("--env=" + requestedEnvironment)) {
							let oneProcess = oneCMDLine.replace(/\s+/g, ' ').split(' ');
							PID = oneProcess[1];
						}
					}
				}
			});
			
			//if no PID return, nothing to do
			if (!PID) {
				return callback(false);
			}
			return callback(PID);
		} else {
			return callback(false);
		}
	});
}

const serviceModule = {
	
	/**
	 * This command will calculate the needed env variables and
	 * start the requested service if supported in the requested environment
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'start': (args, callback) => {
		//if (args.length < 2) {
		//    return callback();
		//}
		
		//check if service is supported
		let requestedService = args[0];
		let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
		}
		let serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
		if (!VERSION_INFO.services[requestedService]) {
			serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
			return callback(`${serviceType} ${requestedService} is not supported!`);
		}
		
		if (args.length < 2) {
			return callback(`Specify the environment by setting [--env=%env_code%] where you want ${requestedService} to be deployed!`);
		}
		
		//check for environment
		let requestedEnvironment = args[1];
		if (!requestedEnvironment.includes("--env")) {
			return callback(`Specify the environment where you want ${requestedService} to be deployed!`);
		}
		requestedEnvironment = requestedEnvironment.split("=");
		if (!requestedEnvironment[1] || requestedEnvironment[1] === '') {
			return callback(`Specify the environment where you want ${requestedService} to be deployed!`);
		}
		requestedEnvironment = requestedEnvironment[1].toLowerCase();
		
		//check if service is installed and downloaded
		if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
			return callback(`${serviceType} ${requestedService} is not installed!`);
		}
		
		if (requestedService === 'dashboard' && requestedEnvironment !== 'dashboard') {
			return callback(`The Dashboard Microservice can only run in the DASHBOARD environment!`);
		}
		
		let repoPath = installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services[requestedService].repo;
		
		let requestedVersion = args[2];
		if (requestedVersion && requestedVersion.includes("--version")) {
			requestedVersion = requestedVersion.split("=");
			if (!requestedVersion[1] || requestedVersion[1] === '') {
				return callback(`Specify the service version by setting [--version=%VERSION%] you want to install!`);
			}
			requestedVersion = requestedVersion[1].toLowerCase();
			repoPath = installerConfig.workingDirectory + "/extra/" + requestedService + requestedVersion + "/node_modules/" + VERSION_INFO.services[requestedService].repo;
		}
		
		//check if service folder exists
		fs.stat(repoPath, (error, stats) => {
			if (error || !stats) {
				logger.debug(`\tTrying to run service @ ${repoPath}`);
				return callback(`${serviceType} ${requestedService} is not installed!`);
			}
			
			//set and ensure the log directory
			let logLoc;
			switch (process.env.PLATFORM) {
				case 'Darwin':
					logLoc = "/usr/local/var/log/soajs/";
					break;
				//case 'Linux':
				default:
					logLoc = "/var/log/soajs/";
					break;
			}
			
			//check log file
			fs.stat(logLoc, (error, stats) => {
				if (error) {
					if (error.code === 'ENOENT' && !stats) {
						//create log file
						mkdirp(logLoc, (error) => {
							if (error) {
								return callback(`Unable to create a Log File for ${serviceType} ${requestedService}!`);
							}
							
							if (requestedService === 'ui') {
								launchUI(logLoc);
							}
							else {
								launchService(logLoc);
							}
						});
					}
					else {
						return callback(`Unable to create a Log File for ${serviceType} ${requestedService}!`);
					}
				}
				else {
					if (requestedService === 'ui') {
						launchUI(logLoc);
					}
					else {
						launchService(logLoc);
					}
				}
			});
		});
		
		//function that sets the aggregated variables as environment variables and launches the service.
		function launchService(logLoc) {
			process.env.SOAJS_ENV = requestedEnvironment;
			process.env.SOAJS_SRVIP = '127.0.0.1';
			process.env.SOAJS_PROFILE = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
			process.env.NODE_ENV = 'production';
			process.env.SOAJS_MONGO_CON_KEEPALIVE = 'true';
			process.env.SOAJS_DEPLOY_MANUAL = 1;
			
			checkIfServiceIsRunning(requestedService, requestedEnvironment, (PID) => {
				if (PID) {
					return callback(null, `Service ${requestedService} is already running.`);
				}
				else {
					let runService = () => {
						//check for custom port
						if (args[2] && args[2].includes("--port")) {
							let customServicePort = args[2].split("=");
							if (customServicePort[1] && customServicePort[1] !== '') {
								process.env.SOAJS_SRVPORT = customServicePort[1];
							}
						}
						
						let outLog = path.normalize(logLoc + `/${requestedEnvironment}-${requestedService}-out.log`);
						let serviceOutLog = fs.openSync(outLog, "w");
						
						let errLog = path.normalize(logLoc + `/${requestedEnvironment}-${requestedService}-err.log`);
						let serviceErrLog = fs.openSync(errLog, "w");
						
						let serviceInstance = spawn(process.env.NODE_BIN, [repoPath + `/index.js`, `--env=${requestedEnvironment}`], {
							"env": process.env,
							"stdio": ['ignore', serviceOutLog, serviceErrLog],
							"detached": true,
						});
						serviceInstance.unref();
						
						//generate out message for service
						let output = `Service ${requestedService} started ...\n`;
						output += "Logs:\n";
						output += `[ out ] -> ${outLog}\n`;
						output += `[ err ] -> ${errLog}\n`;
						setTimeout(() => {
							return callback(null, output);
						}, 1000);
					};
					if (requestedService !== "gateway") {
						mongo_module.getControllerPort([requestedEnvironment], (error, ports) => {
							if (error) {
								if (error.message) {
									logger.error(error.message);
								} else {
									logger.error(error);
								}
								return callback(error);
							}
							process.env.SOAJS_REGISTRY_API = "127.0.0.1:" + (ports.controller + ports.maintenanceInc);
							runService();
						});
					} else {
						runService();
					}
				}
			});
		}
		
		//function that starts the ui express app which contains the soajs console ui.
		function launchUI(logLoc) {
			checkIfServiceIsRunning(requestedService, requestedEnvironment, (PID) => {
				if (PID) {
					nextInUI();
				}
				else {
					let outLog = path.normalize(logLoc + `/${requestedEnvironment}-${requestedService}-out.log`);
					let serviceOutLog = fs.openSync(outLog, "w");
					
					let errLog = path.normalize(logLoc + `/${requestedEnvironment}-${requestedService}-err.log`);
					let serviceErrLog = fs.openSync(errLog, "w");
					
					let serviceInstance = spawn(process.env.NODE_BIN, [installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services[requestedService].repo + "/app/index.js"], {
						"env": process.env,
						"stdio": ['ignore', serviceOutLog, serviceErrLog],
						"detached": true,
					});
					serviceInstance.unref();
					nextInUI();
				}
			});
			
			function nextInUI() {
				//require the ui config to learn the host and the port values
				fs.stat(installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services[requestedService].repo + "/app/config.js", (error) => {
					if (error) {
						if (error.code === 'ENOENT') {
							return callback(null, null);
						}
						else {
							return callback(error);
						}
					}
					else {
						let uiConfig = require(installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services[requestedService].repo + "/app/config.js");
						if (uiConfig && typeof uiConfig === 'object') {
							//generate output message for ui
							let output = `SOAJS Console UI started ...\n`;
							output += `In your Browser, open: http://${uiConfig.host}:${uiConfig.port}/ \n`;
							return callback(null, output);
						}
						else {
							return callback(null, null);
						}
					}
				});
			}
		}
	},
	
	/**
	 * This command will find the process id of the requested service in the requested environment and kill it
	 * @param args
	 * @param callback
	 * @returns {*}
	 */
	'stop': (args, callback) => {
		//if (args.length < 2) {
		//    return callback();
		//}
		
		//check if service is supported
		let requestedService = args[0];
		let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
		}
		let serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
		if (!VERSION_INFO.services[requestedService]) {
			serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
			return callback(`${serviceType} ${requestedService} is not supported!`);
		}
		
		if (args.length < 2) {
			return callback(`Specify the environment by setting [--env=%env_code%] where you want ${requestedService} to be deployed!`);
		}
		
		//check for environment
		let requestedEnvironment = args[1];
		if (!requestedEnvironment.includes("--env")) {
			return callback(`Specify the environment where you want ${requestedService} to be deployed!`);
		}
		requestedEnvironment = requestedEnvironment.split("=");
		if (!requestedEnvironment[1] || requestedEnvironment[1] === '') {
			return callback(`Specify the environment where you want ${requestedService} to be deployed!`);
		}
		requestedEnvironment = requestedEnvironment[1].toLowerCase();
		
		//check if there is a running process for the requested
		checkIfServiceIsRunning(requestedService, requestedEnvironment, (PID) => {
			if (PID) {
				//stop the running process
				exec(`kill -9 ${PID}`, (error) => {
					if (error) {
						return callback(error);
					}
					else {
						return callback(null, `${serviceType} ${requestedService} Terminated ...`);
					}
				});
			}
			else {
				return callback();
			}
		});
	},
	
	'restart': (args, callback) => {
		
		//check if service is supported
		let requestedService = args[0];
		let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
		}
		let serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
		if (!VERSION_INFO.services[requestedService]) {
			serviceType = (requestedService === 'ui') ? 'SOAJS Console' : 'Service';
			return callback(`${serviceType} ${requestedService} is not supported!`);
		}
		
		logger.info(`Restarting ${serviceType} ${requestedService} ...`);
		
		serviceModule.stop(args, (error, msg) => {
			if (error) {
				return callback(error, msg);
			}
			let output = msg;
			serviceModule.start(args, (error, msg) => {
				output += `\n`;
				output += msg;
				return callback(error, output);
			});
		});
	},
	
	'install': (args, callback) => {
		if (args.length < 1) {
			return callback(`Missing parameters for service install, check usage soajs --help!`);
		}
		let argument = args[0];
		let availableService = versionInfo.getServiceVersions();
		
		if (argument && argument.includes("--info")) {
			let output = "Available services: \n";
			if (availableService.info && availableService.info.length > 0) {
				output += "\t" + availableService.info.join(" \n\t");
			} else {
				output += "No services are available to install at this time!";
			}
			return callback(null, output);
		}
		
		let serviceName = argument;
		if (!availableService.services.includes(serviceName)) {
			return callback(`Service [${serviceName}] is not one of the available services!`);
		}
		argument = args[1];
		let version = null;
		if (argument && argument.includes("--version")) {
			version = argument.split("=");
			if (!version[1] || version[1] === '') {
				return callback(`Specify the service version by setting [--version=%VERSION%] you want to install!`);
			}
			version = version[1].toLowerCase();
		} else {
			return callback(`Specify the service version by setting [--version=%VERSION%] you want to install!`);
		}
		let packVersion = null;
		if (version && availableService.versions[serviceName] && availableService.packs[serviceName]) {
			for (let i = 0; i < availableService.versions[serviceName].length; i++) {
				if (availableService.versions[serviceName][i].label === version) {
					packVersion = availableService.versions[serviceName][i].version;
				}
			}
			if (!packVersion) {
				return callback(`The specified service version [${version}] for [${serviceName}], is not available. Run soajs service install --info`);
			}
			
			installer.npm(installerConfig, {
				"version": version,
				"packVersion": packVersion,
				"pack": availableService.packs[serviceName],
				"serviceName": serviceName
			}, (error) => {
				
				return callback(error);
			});
		} else {
			return callback(`Missing parameters for service install, check usage soajs --help!`);
		}
	}
};

module.exports = serviceModule;