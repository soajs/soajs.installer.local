'use strict';

const async = require('async');
const path = require("path");
const fs = require("fs");
const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));
const remote_installer = require(path.normalize(process.env.PWD + "/../soajs.installer.remote/libexec/index.js"));


const packagejson = require("../../../package.json");
const local_packagejson = require("../../package.json");
const remote_packagejson = require("../../../soajs.installer.remote/package.json");
const versions_packagejson = require("../../../soajs.installer.versions/package.json");

const installerVersions = {
	"installer": packagejson.version,
	"local": local_packagejson.version,
	"remote": remote_packagejson.version,
	"versions": versions_packagejson.version
};
const readline = require('readline');

//set the logger
const logger = require("../utils/utils.js").getLogger();


let lib = {
	"getUserConfiguration": (fileName, callback) => {
		if (!fileName) {
			return callback("Please provide remote installer configuration... for more information PLease contact SOAJS @ https://www.soajs.org/contactUs");
		}
		fs.stat(fileName, (error, stats) => {
			if (error || !stats) {
				return callback("Unable find remote installer configuration (might be permissions): " + fileName);
			}
			fs.readFile(fileName, (error, userConfiguration) => {
				if (error || !userConfiguration) {
					return callback("Unable read remote installer configuration (might be permissions): " + fileName);
				}
				try {
					userConfiguration = JSON.parse(userConfiguration);
				} catch (e) {
					return callback("Unable parse remote installer configuration (might be permissions): " + fileName);
				}
				return callback(null, userConfiguration);
			});
		});
	},
	"getOptions": (userConfiguration, cleanDataBefore, callback) => {
		let VERSION_INFO = versionInfo.getVersionInfo();
		if (!VERSION_INFO || !VERSION_INFO.services) {
			return callback("Unable continue, missing installer versions information!");
		}
		let dataPath = path.normalize(process.env.PWD + "/../soajs.installer.remote/data/provision/");
		let options = {
			"versions": VERSION_INFO,
			"installerVersion": installerVersions,
			
			"cleanDataBefore": cleanDataBefore,
			
			"driverName": "kubernetes",
			"dataPath": dataPath,
			"importer": require('./../custom/index.js'),
			
			"mongo": userConfiguration.mongo,
			"kubernetes": userConfiguration.kubernetes,
			"nginx": userConfiguration.nginx,
			"owner": userConfiguration.owner,
			
			"deployment": userConfiguration.deployment || {}
		};
		return callback(null, options);
	}
};

const serviceModule = {
	
	'install': (args, callback) => {
		logger.info(`SOAJS Remote Cloud Installer started ...`);
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			let cleanDataBefore = false;
			if (args.length === 2) {
				if (args[1] === "--clean") {
					cleanDataBefore = true;
				}
				else {
					args.shift();
					return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs remote-installer install %folder% [--clean].`);
				}
			}
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			rl.question('You are about to install SOAJS and remove any existing installation, are you sure you want to continue? [Y/N]', (answer) => {
				rl.close();
				if (answer === "Y" || answer === "y") {
					lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
						if (error) {
							return callback(error);
						}
						remote_installer.install(options, (error) => {
							return callback(error, "SOAJS remote installer done!");
						});
					});
				} else {
					logger.info(`Remote Cloud Installer terminating ...`);
					return callback(null, "SOAJS remote installer done!");
				}
				
			});
		});
	},
	
	"info": (args, callback) => {
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			let cleanDataBefore = false;
			lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
				if (error) {
					return callback(error);
				}
				remote_installer.getSettings(options, (error, settings) => {
					if (error) {
						return callback(error);
					}
					remote_installer.getInfo(options, (error, deployments) => {
						if (error) {
							return callback(error);
						}
						let releaseInfo = versionInfo.getVersionInfo(settings.releaseInfo.name);
						let latest = versionInfo.getLatest();
						
						let output = "\nSOAJS Remote Release Information:\n";
						
						output += "\n=======================\n";
						output += "Your current installed release is: [" + settings.releaseInfo.name + "] and patch [" + settings.releaseInfo.patch + "]\n";
						
						output += "The microservices versions:\n";
						
						let verOutput = "";
						let verOk = true;
						let verMightOk = false;
						for (let i = 0; i < deployments.services.length; i++) {
							output += "\t" + deployments.services[i].serviceName + ": " + deployments.services[i].image;
							if (deployments.services[i].branch) {
								output += " - " + deployments.services[i].branch;
							}
							verOutput += "\t" + deployments.services[i].serviceName;
							if (releaseInfo.services[deployments.services[i].serviceName]) {
								let str = deployments.services[i].branch || deployments.services[i].image;
								if (str.indexOf(":") !== -1) {
									str = str.substr(str.indexOf(":") + 1);
								} else if (str.indexOf("v") !== -1) {
									str = str.substr(str.indexOf("v") + 1);
								}
								let ver = releaseInfo.services[deployments.services[i].serviceName].semVer;
								if (str.indexOf(".x") !== -1) {
									ver = releaseInfo.services[deployments.services[i].serviceName].ver;
									verMightOk = true;
								}
								verOutput += " " + str + " - " + ver;
								
								if (str === ver) {
									verOutput += " => up-to-date";
								} else {
									verOutput += " => NOT up-to-date!";
									verOk = false;
								}
							}
							verOutput += "\n";
							output += "\n";
						}
						
						output += "\n=======================\n";
						output += "Updates:\n";
						
						if (settings.releaseInfo.name === latest) {
							output += "\tcurrently you are using the latest release.\n\n";
							if (settings.releaseInfo.patch === releaseInfo.patch) {
								output += verOutput;
								output += "\n";
								if (verMightOk) {
									if (verOk) {
										output += "\teverything might be up-to-date\n";
									} else {
										output += "\tnot everything is up-to-date!\n";
									}
									output += "\ta SOAJS deployment of version style [major] detected for one or many service(s). contact soajs for more information!\n";
								} else {
									if (verOk) {
										output += "\teverything is up-to-date, enjoy!\n";
									} else {
										output += "\tnot everything is up-to-date!\n";
									}
								}
							} else {
								if (releaseInfo.previousPatches.includes(settings.releaseInfo.patch)) {
									output += "\tyou do not have the latest patch, the latest patch is: [" + releaseInfo.patch + "].\n";
									if (releaseInfo.prerequisite && Array.isArray(releaseInfo.prerequisite)) {
										for (let i = 0; i < releaseInfo.prerequisite.length; i++) {
											let prerequisite = releaseInfo.prerequisite[i];
											if (prerequisite.patch === releaseInfo.patch) {
												if (prerequisite.migration) {
													output += "\tthis patch has migrate(s) prerequisite: " + prerequisite.migration.join(" - ");
												}
											}
										}
									}
								}
							}
						} else {
							output += "\tcurrently you not are using the latest release. [" + latest + "] is the latest release.\n";
							output += "\tplease contact soajs team for more information!\n";
						}
						
						console.log(output);
						
						return callback();
					});
				});
			});
		});
	},
	
	
	"backup": (args, callback) => {
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			let cleanDataBefore = false;
			lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
				if (error) {
					return callback(error);
				}
				remote_installer.getInfo(options, (error, deployments) => {
					if (error) {
						return callback(error);
					}
					
					let backupID = new Date().getTime().toString();
					
					logger.info("The backup ID is: " + backupID);
					
					async.each(deployments.services, (oneService, cb) => {
						
						let requestedService = oneService.serviceName;
						let backup = {
							"path": process.env.PWD + "/../etc/backup/" + backupID + "/"
						};
						remote_installer.backupService(options, requestedService, backup, (error, done) => {
							if (done) {
								return cb();
							}
							return cb(error);
						});
					}, (error) => {
						if (error) {
							return callback(error);
						} else {
							return callback(error);
							
						}
					});
				});
			});
		});
	},
	
	/**
	 * To update a service within the same release and patch
	 * @param args
	 * @param callback
	 */
	"update": (args, callback) => {
		if (args.length !== 2) {
			return callback(null, "remote-installer update needs 2 arguments [serviceName] [configuration]");
		}
		if (args.length === 0) {
			return callback(null, "Missing service!");
		}
		let requestedService = args[0];
		args.shift();
		
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			let cleanDataBefore = false;
			lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
				if (error) {
					return callback(error);
				}
				if (!options.versions.services[requestedService]) {
					return callback(`${requestedService} is not supported!`);
				}
				let rollback = {
					"path": process.env.PWD + "/../etc/rollback"
				};
				remote_installer.updateService(options, requestedService, rollback, (error, done) => {
					if (done) {
						return callback(error, "Service [" + requestedService + "] updated");
					} else {
						return callback(error, "Service [" + requestedService + "] was not updated");
					}
				});
			});
		});
	},
	
	/**
	 * Migrate soajs provision data
	 * @param args
	 * @param callback
	 */
	"migrate": (args, callback) => {
		if (args.length === 0) {
			return callback(null, "Missing migration strategy!");
		}
		let strategies = require(path.normalize(process.env.PWD + "/../soajs.installer.remote/libexec/migrate/config.js"));
		let strategy = args[0];
		
		if (strategies.indexOf(strategy) === -1) {
			return callback(null, `Select one of the following strategies: ${strategies.join(" ")}.`);
		}
		args.shift();
		
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			
			let cleanDataBefore = false;
			if (args.length === 2) {
				if (args[1] === "--clean") {
					cleanDataBefore = true;
				}
				else {
					args.shift();
					return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs remote-installer install %folder% [--clean].`);
				}
			}
			lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
				if (error) {
					return callback(error);
				}
				remote_installer.migrate(options, strategy, (error, response) => {
					return callback(error, response);
				});
			});
		});
	}
};

module.exports = serviceModule;