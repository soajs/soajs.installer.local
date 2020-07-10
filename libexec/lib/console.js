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

const request = require("request");
const mkdirp = require("mkdirp");
const async = require("async");
const rimraf = require("rimraf");
const exec = require("child_process").exec;

let installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));
const serviceModule = require("./service");
const mongoModule = require("./mongo");

const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));

//set the logger
const logger = require("../utils/utils.js").getLogger();

const SOAJS_CORE = {
	'soajs': 'soajs',
	'libs': 'soajs.core.libs',
	'drivers': 'soajs.core.drivers',
	'modules': 'soajs.core.modules',
	'uracDriver': 'soajs.urac.driver',
};

function getInstalledVersion(update) {
	if (installerConfig && installerConfig.version) {
		let workingDirectory = installerConfig.workingDirectory;
		if (!installerConfig.patch) {
			updateConfigFile(workingDirectory, installerConfig.version, () => {
				logger.debug(`Update release patch for the first time`);
			});
		} else if (update) {
			updateConfigFile(workingDirectory, installerConfig.version, () => {
				logger.debug(`Updating release version & patch`);
			});
		}
		return installerConfig.version;
	}
	let version = null;
	if (installerConfig.workingDirectory) {
		version = versionInfo.getLatest();
		let workingDirectory = installerConfig.workingDirectory;
		updateConfigFile(workingDirectory, version, () => {
			logger.debug(`Update release version for the first time`);
		});
	}
	return version;
}

function updateConfigFile(workingDirectory, version, cb) {
	if (!installerConfig) {
		installerConfig = {};
	}
	let VERSION_INFO = null;
	if (version && version !== '') {
		VERSION_INFO = versionInfo.getVersionInfo(version);
	}
	installerConfig.workingDirectory = workingDirectory;
	installerConfig.version = version;
	if (VERSION_INFO) {
		installerConfig.patch = VERSION_INFO.patch;
	}
	let newData = "'use strict';\n\n";
	newData += "module.exports = " + JSON.stringify(installerConfig, null, 2) + ";\n";
	fs.writeFile(path.normalize(process.env.PWD + "/../etc/config.js"), newData, cb);
}

function installConsoleComponents(upgrade, cb) {
	let myPath = installerConfig.workingDirectory + "/node_modules/";
	fs.stat(myPath, (error, stats) => {
		if (error) {
			if (error.code === 'ENOENT' && !stats) {
				//if not found create the directories needed recursively
				mkdirp(myPath, runNPM);
			}
			else {
				return cb(error);
			}
		}
		else {
			runNPM();
		}
	});
	
	function checkIfModuleIsInstalled(oneRepo, cb) {
		if (upgrade) {
			return cb(null, false);
		}
		logger.debug("checking if repo is downloaded:", oneRepo);
		fs.stat(path.normalize(myPath + "/" + oneRepo), (error, stats) => {
			if (error) {
				if (error.code === 'ENOENT' && !stats) {
					//not found
					return cb(null, false);
				}
				else {
					return cb(error);
				}
			}
			else {
				return cb(null, true);
			}
		});
	}
	
	//install repos in component
	function runNPM() {
		logger.debug("\nInstalling SOAJS Console Components ...\n");
		
		let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return cb("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
		}
		async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
			let oneRepo = oneServiceInfo.repo;
			if (oneServiceInfo.type === "console" || oneServiceInfo.type === "any") {
				if (oneServiceInfo.ver) {
					oneRepo += "@" + oneServiceInfo.semVer;
				}
				checkIfModuleIsInstalled(oneRepo, (error, exists) => {
					if (error) {
						return mCb(error);
					}
					
					if (exists) {
						return mCb(null, true);
					}
					
					let pathLoc = path.normalize(installerConfig.workingDirectory + "/node_modules/");
					
					logger.info(`Installing ${oneService} from NPM ${oneRepo} in ${pathLoc} ...`);
					logger.debug(`sudo ${process.env.NPM_BIN} install ${oneRepo}`);
					let modInstall = exec(`sudo ${process.env.NPM_BIN} install ${oneRepo}`, {
						cwd: pathLoc
					});
					
					modInstall.stdout.on('data', (data) => {
						if (data) {
							//process.stdout.write(data);
						}
					});
					
					modInstall.stderr.on('data', (error) => {
						if (error) {
							process.stdout.write(error);
						}
					});
					
					modInstall.on('close', (code) => {
						if (code === 0) {
							logger.debug(`${oneService} installed!\n`);
							setTimeout(() => {
								return mCb(null, true);
							}, 1000);
						}
						else {
							return mCb("Error installing " + oneService + "!\n");
						}
					});
					
				});
			} else {
				return mCb(null, true);
			}
		}, (error) => {
			if (error) {
				return cb(error);
			}
			
			return cb(null, true);
		});
	}
}

function ifNotSudo(callback) {
	if (process.env.PLATFORM === 'Linux' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as Root!\n";
		return callback(output);
	}
	else if (process.env.PLATFORM === 'Darwin' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as: sudo soajs console " + process.env.SOAJS_INSTALLER_COMMAND;
		return callback(output);
	}
}

const consoleModule = {
	
	/**
	 * This function configures and starts mongodb server stand alone
	 * then it patches the provisioned data in mongdb server
	 * then it installs all of SOAJS Console components
	 * then it starts all the SOAJS Console components
	 * @param args
	 * @param callback
	 */
	'install': (args, callback) => {
		if (args.length === 0) {
			return callback("Please provide where you want to install the SOAJS Console. Ex: soajs console install /%folder_path%");
		}
		
		ifNotSudo(callback);
		
		//clean up the path ...
		if (args[0].charAt(0) !== '/') {
			return callback("Invalid folder path; please provide an absolute folder path to install the console. Ex: soajs console install /%folder_path%.");
		}
		
		if (args[0].includes("node_modules")) {
			let myPath = args[0].split(path.sep);
			for (let i = myPath.length - 1; i > 0; i--) {
				if (myPath[i].trim() === '') {
					myPath.splice(i, 1);
				}
			}
			
			if (myPath[myPath.length - 1] === 'node_modules') {
				myPath.pop();
				myPath = myPath.join(path.sep);
				args[0] = path.normalize(myPath);
			}
		}
		
		logger.debug(`Checking provided path: ${args[0]} ...`);
		fs.stat(args[0], (error, stats) => {
			if (error) {
				if (error.code === 'ENOENT' && !stats) {
					//create the working directory
					mkdirp(path.normalize(args[0] + "/node_modules/"), (error) => {
						if (error) {
							return callback("Unable to work in provided folder path (might be permissions): " + args[0]);
						}
						updateConfiguration();
					});
				}
				else {
					return callback(error);
				}
			}
			else {
				updateConfiguration();
			}
		});
		
		function updateConfiguration() {
			logger.debug(`Configuring installer ...`);
			
			//update the configuration file
			//installerConfig.workingDirectory = args[0];
			
			updateConfigFile(args[0], versionInfo.getLatest(), (error) => {
				if (error) {
					return callback("Unable to update Installer configuration file, please try again!");
				}
				
				//install and start mongo
				launchMongo();
			});
		}
		
		function launchMongo() {
			logger.debug(`Configuring MongoDB Server ...`);
			mongoModule.install([], (error, response) => {
				if (error) {
					return callback(error);
				}
				
				logger.debug(response);
				setTimeout(() => {
					logger.debug(`Starting MongoDB Server ...`);
					mongoModule.start([], (error, response) => {
						if (error) {
							return callback(error);
						}
						
						logger.debug(response);
						setTimeout(() => {
							
							logger.debug(`Importing Data in MongoDB Server ...`);
							mongoModule.patch([], (error, response) => {
								if (error) {
									return callback(error);
								}
								
								logger.debug(response);
								installSOAJSConsole();
							});
						}, 10000); //wait for mongo to become ready
					});
				}, 100);
			});
		}
		
		function installSOAJSConsole() {
			logger.debug(`Installing SOAJS Console ...`);
			//install all repository content
			installConsoleComponents(false, (error) => {
				if (error) {
					if (error.message) {
						logger.error(error.message);
					} else {
						logger.error(error);
					}
					return callback("Error while isntalling the SOAJS Console files!");
				}
				
				return callback(null, "SOAJS Console Installed!");
				/*
				//start microservices
				consoleModule.start(args, (error) => {
					if (error) {
						return callback("Unable to Start the SOAJS Console!");
					}
					
					return callback(null, "SOAJS Console Started!");
				});
				*/
			});
		}
	},
	
	/**
	 * This function will stop all the services of SOAJS Console
	 * it will then run npm install in the working directory to update all the microservices repos related
	 * then it will start the services of SOAJS Console again
	 * @param args
	 * @param callback
	 */
	'update': (args, callback) => {
		if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
			return callback(`SOAJS Console is not installed!`);
		}
		
		ifNotSudo(callback);
		
		logger.info("Updating SOAJS Console ...");
		setTimeout(() => {
			//stop microservices
			consoleModule.stop(args, (error) => {
				if (error) {
					if (error.message) {
						logger.error(error.message);
					} else {
						logger.error(error);
					}
					return callback("Unable to Stop the SOAJS Console!");
				}
				
				logger.info("Cleaning up before updating SOAJS Console ...\n");
				setTimeout(() => {
					let cleanDataBefore = false;
					if (args.length > 0) {
						if (args[0] === "--clean") {
							cleanDataBefore = true;
						}
					}
					let packlockFile = path.normalize(installerConfig.workingDirectory + "/package-lock.json");
					fs.stat(packlockFile, (error, stats) => {
						if (stats) {
							rimraf(packlockFile, () => {
							});
						}
						if (cleanDataBefore) {
							logger.info("\t Cleaning everything ...\n");
							
							rimraf(path.normalize(installerConfig.workingDirectory + "/node_modules/*"), (error) => {
								if (error) {
									if (error.message) {
										logger.error(error.message);
									} else {
										logger.error(error);
									}
									return callback("Error while updating the SOAJS Console files!");
								}
								//update all repository content
								installConsoleComponents(true, (error) => {
									if (error) {
										if (error.message) {
											logger.error(error.message);
										} else {
											logger.error(error);
										}
										return callback("Error while updating the SOAJS Console files!");
									}
									//start microservices
									consoleModule.start(args, (error) => {
										if (error) {
											return callback("Unable to Restart the SOAJS Console!");
										}
										return callback(null, "SOAJS Console Updated!");
									});
								});
							});
						} else {
							logger.info("\t Cleaning SOAJS deployed microservices ...\n");
							//remove folders of microservices && core
							let ms_and_core = SOAJS_CORE;
							let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion(true));
							if (!VERSION_INFO || !VERSION_INFO.services) {
								return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
							}
							for (let ms in VERSION_INFO.services) {
								if (VERSION_INFO.services.hasOwnProperty(ms)) {
									let oneServiceInfo = VERSION_INFO.services[ms];
									if (oneServiceInfo.repo) {
										if (oneServiceInfo.type === "console" || oneServiceInfo.type === "any") {
											ms_and_core[ms] = oneServiceInfo.repo;
										}
									}
								}
							}
							async.eachOfSeries(ms_and_core, (oneRepo, oneService, mCb) => {
								logger.debug(`Removing ${oneService} files ...`);
								logger.debug(path.normalize(installerConfig.workingDirectory + "/node_modules/" + ms_and_core[oneService]));
								rimraf(path.normalize(installerConfig.workingDirectory + "/node_modules/" + ms_and_core[oneService]), (error) => {
									if (error) {
										if (error.message) {
											logger.error(error.message);
										} else {
											logger.error(error);
										}
										return mCb(error);
									}
									logger.debug(oneService + " --> " + oneRepo + ": Removed!\n");
									return mCb();
								});
							}, (error) => {
								if (error) {
									return callback("Error Cleaning up before updating SOAJS Console ...");
								}
								//update all repository content
								installConsoleComponents(true, (error) => {
									if (error) {
										if (error.message) {
											logger.error(error.message);
										} else {
											logger.error(error);
										}
										return callback("Error while updating the SOAJS Console files!");
									}
									//start microservices
									consoleModule.start(args, (error) => {
										if (error) {
											return callback("Unable to Restart the SOAJS Console!");
										}
										return callback(null, "SOAJS Console Updated!");
									});
								});
							});
						}
					});
				}, 2000);
			});
		}, 2000);
	},
	
	/**
	 * This function will stop all services of SOAJS Console
	 * it will also stop mongodb and clean up all SOAJS data from the database
	 * Then it will remove all the installed files and folders of SOAJS Console (PURGE Everything)
	 * @param args
	 * @param callback
	 */
	'remove': (args, callback) => {
		if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
			return callback(`SOAJS Console is not installed!`);
		}
		
		ifNotSudo(callback);
		
		logger.info("Removing SOAJS Console ...\n\n");
		setTimeout(() => {
			//stop microservices
			consoleModule.stop(args, (error) => {
				if (error && error.toString() !== `SOAJS Console is not installed!`) {
					return callback("Unable to Stop the SOAJS Console!");
				}
				
				const mongoModule = require("./mongo.js");
				logger.info("Cleaning up Mongo and stopping it ...");
				setTimeout(() => {
					//remove data from mongodb
					mongoModule.clean([], (error) => {
						if (error && !error.message.includes("failed to connect to server")) {
							return callback("Error while Cleaning provisioned data from mongo!");
						}
						//stop mongodb
						mongoModule.stop([], (error) => {
							if (error) {
								return callback("Error while Stopping MongoDB Server!");
							}
							
							logger.info("Cleaning up downloaded SOAJS Console ...");
							setTimeout(() => {
								//remove folders of microservices
								let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
								if (!VERSION_INFO || !VERSION_INFO.services) {
									return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
								}
								async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
									let oneRepo = oneServiceInfo.repo;
									if (oneServiceInfo.type === "console" || oneServiceInfo.type === "any") {
										logger.debug(`Removing ${oneService} files ...`);
										logger.debug(path.normalize(installerConfig.workingDirectory + "/node_modules/" + oneRepo) + "\n");
										rimraf(path.normalize(installerConfig.workingDirectory + "/node_modules/" + oneRepo), (error) => {
											if (error) {
												if (error.message) {
													logger.error(error.message);
												} else {
													logger.error(error);
												}
												return mCb(error);
											}
											logger.debug(`${oneService} --> ${oneRepo}: Removed!`);
											return mCb();
										});
									} else {
										return mCb();
									}
								}, (error) => {
									if (error) {
										return callback("Error Cleaning up SOAJS Console ...");
									}
									
									//remove working directory
									rimraf(path.normalize(installerConfig.workingDirectory), (error) => {
										if (error) {
											if (error.message) {
												logger.error(error.message);
											} else {
												logger.error(error);
											}
											return callback(error);
										}
										
										//clean up the configuration file
										updateConfigFile('', null, () => {
											logger.info("=========================\nSOAJS Console Removed!\n=========================\n\n");
											setTimeout(() => {
												return callback();
											}, 1000);
										});
									});
								});
								
							}, 2000);
						});
					});
				}, 2000);
			});
			
		}, 2000);
	},
	
	/**
	 * This function restarts all the services of the SOAJS Console
	 * @param args
	 * @param callback
	 */
	'restart': (args, callback) => {
		if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
			return callback(`SOAJS Console is not installed!`);
		}
		
		ifNotSudo(callback);
		
		logger.info("Restarting SOAJS Console ...\n\n");
		setTimeout(() => {
			consoleModule.stop(args, (error) => {
				if (error && error.toString() !== `SOAJS Console is not installed!`) {
					return callback("Unable to Stop the SOAJS Console!");
				}
				
				consoleModule.start(args, (error) => {
					if (error) {
						return callback("Unable to Restart the SOAJS Console!");
					}
					
					return callback(null, "SOAJS Console Restarted!");
				});
			});
		}, 2000);
	},
	
	/**
	 * This command will calculate the needed env variables and
	 * start all the microservices in dashboard environment that the soajs console requires
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'start': (args, callback) => {
		let requestedEnvironment = 'dashboard';
		
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
			
			logger.info("Starting Microservices for SOAJS Console in Dashboard Environment ... \n");
			setTimeout(() => {
				let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
				if (!VERSION_INFO || !VERSION_INFO.services) {
					return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
				}
				async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
					if (oneServiceInfo.type === "console" || oneServiceInfo.type === "any") {
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
						return callback("Error starting the SOAJS Console");
					}
					
					reloadControllerAwareness((error) => {
						if (error) {
							return callback(error);
						}
						else {
							logger.info("=========================\nSOAJS Console started!\n=========================\n\n");
							setTimeout(() => {
								return callback();
							}, 1000);
						}
					});
					
				});
			}, 1000);
		});
		
		function launchMyService(oneService, mCb) {
			serviceModule.start([oneService, "--env=" + requestedEnvironment], mCb);
		}
		
		function reloadControllerAwareness(cb) {
			logger.debug("Updating controller registry ...");
			setTimeout(() => {
				request.get({"uri": "http://localhost:5000/reloadRegistry"}, (err) => {
					if (err) {
						return cb(err);
					}
					request.get({"uri": "http://localhost:5000/awarenessStat"}, (err) => {
						if (err) {
							return cb(err);
						}
						return cb(null);
					});
				});
			}, 5000);
		}
	},
	
	/**
	 * This command will find the process id of all microservices that the soajs console is using and kill them
	 * @param args
	 * @param callback
	 * @returns {*}
	 */
	'stop': (args, callback) => {
		
		ifNotSudo(callback);
		
		let requestedEnvironment = 'dashboard';
		
		//check if service is installed and downloaded
		if (!installerConfig.workingDirectory || installerConfig.workingDirectory === '') {
			return callback(`SOAJS Console is not installed!`);
		}
		
		logger.info("Stopping Microservices for SOAJS Console in Dashboard Environment ... \n");
		setTimeout(() => {
			let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
			if (!VERSION_INFO || !VERSION_INFO.services) {
				return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
			}
			async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
				if (oneServiceInfo.type === "console" || oneServiceInfo.type === "any") {
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
					return callback("Error stop the SOAJS Console");
				}
				
				logger.info("=========================\nSOAJS Console Stopped!\n=========================\n\n");
				setTimeout(() => {
					return callback();
				}, 1000);
			});
			
		}, 1000);
		
		function launchMyService(oneService, mCb) {
			serviceModule.stop([oneService, "--env=" + requestedEnvironment], mCb);
		}
	},
	
	/**
	 * Change the host domain fo manual deployment.
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'setHost': (args, callback) => {
		//Verify argument
		if (!Array.isArray(args) || args.length === 0) {
			return callback(null, "Missing host value!");
		}
		if (args.length > 1) {
			args.shift();
			return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs console setHost %host_domain%.`);
		}
		
		let VERSION_INFO = versionInfo.getVersionInfo(getInstalledVersion());
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return callback("Unable to get release information for the installed version [" + getInstalledVersion() + "]");
		}
		
		let uiConfigFile = installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services.ui.repo + "/app/uiConfig.js";
		let uiConfigFile_original = installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services.ui.repo + "/app/original_uiConfig.js";
		fs.stat(uiConfigFile_original, (error, stats) => {
			if (!stats) {
				fs.copyFile(uiConfigFile, uiConfigFile_original, (error) => {
					if (error) {
						return callback(error);
					}
					updateConfig();
				});
			}
			else {
				updateConfig();
			}
			
			function updateConfig() {
				let tntData = fs.readFileSync(uiConfigFile_original, "utf8");
				tntData = tntData.replace(/localhost/g, args[0]);
				fs.writeFileSync(uiConfigFile, tntData, "utf8");
				
				let configFile = installerConfig.workingDirectory + "/node_modules/" + VERSION_INFO.services.ui.repo + "/app/config.js";
				let soajsProfile = require(configFile);
				soajsProfile.host = args[0];
				
				let newProfileData = "'use strict';\n\n";
				newProfileData += "module.exports = " + JSON.stringify(soajsProfile, null, 2) + ";\n";
				
				fs.writeFileSync(configFile, newProfileData);
				return callback(null, `Console host has been updated to ${args[0]}.`);
			}
		});
	}
};

module.exports = consoleModule;