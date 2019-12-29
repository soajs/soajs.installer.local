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
				return callback("Unable to find remote installer configuration (might be permissions): " + fileName);
			}
			fs.readFile(fileName, (error, userConfiguration) => {
				if (error || !userConfiguration) {
					return callback("Unable to read remote installer configuration (might be permissions): " + fileName);
				}
				try {
					userConfiguration = JSON.parse(userConfiguration);
				} catch (e) {
					return callback("Unable to parse remote installer configuration (might be permissions): " + fileName);
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
	},
	
	"restore": (options, filePath, callback) => {
		fs.readFile(filePath + "service.txt", 'utf8', (error, oneService) => {
			if (!error && oneService) {
				fs.readFile(filePath + "deployment.txt", 'utf8', (error, oneDeployment) => {
					if (!error && oneDeployment) {
						try {
							oneService = JSON.parse(oneService);
							oneDeployment = JSON.parse(oneDeployment);
						} catch (e) {
							return callback(e);
						}
						remote_installer.restoreOne(options, oneService, oneDeployment, (error) => {
							return callback(error);
						});
					} else {
						return callback("Unable to read deployment from: " + filePath + "deployment.txt");
					}
				});
			} else {
				return callback("Unable to read service from: " + filePath + "service.txt");
			}
		});
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
						
						if (!settings || !settings.releaseInfo) {
							return callback("Contact SOAJS Team, something is wrong with the installed version, missing settings");
						}
						
						//NOTE: you can only compare within the same patch and release
						let releaseInfo = versionInfo.getVersionInfo(settings.releaseInfo.name, settings.releaseInfo.patch);
						
						if (!releaseInfo || !releaseInfo.services) {
							return callback("Contact SOAJS Team, something is wrong with the installed version, missing services");
						}
						
						let latest = versionInfo.getLatest();
						
						let output = "\nSOAJS Remote Release Information:\n";
						
						output += "\n=======================\n";
						output += "Your current installed release is: [" + settings.releaseInfo.name + "] and patch [" + settings.releaseInfo.patch + "]\n";
						
						output += "The microservices versions:\n";
						
						let verOk = true;
						let verMightOk = false;
						for (let i = 0; i < deployments.services.length; i++) {
							output += "\t" + deployments.services[i].serviceName + ": " + deployments.services[i].image;
							if (deployments.services[i].branch) {
								output += " - " + deployments.services[i].branch;
							}
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
								
								if (str !== ver) {
									output += " --> " + ver + " : NOT up-to-date!";
									verOk = false;
								}
							}
							output += "\n";
						}
						
						//NOTE: get version info only for the release
						let VERSION_INFO = versionInfo.getVersionInfo(settings.releaseInfo.name);
						
						output += "\n=======================\n";
						output += "Updates:\n";
						
						if (settings.releaseInfo.name === latest) {
							output += "\tcurrently you are using the latest release.\n\n";
							if (settings.releaseInfo.patch === VERSION_INFO.patch) {
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
								if (VERSION_INFO.previousPatches.includes(settings.releaseInfo.patch)) {
									output += "\tyou do not have the latest patch, the latest patch is: [" + VERSION_INFO.patch + "].\n";
									if (VERSION_INFO.prerequisite && Array.isArray(VERSION_INFO.prerequisite)) {
										for (let i = 0; i < VERSION_INFO.prerequisite.length; i++) {
											let prerequisite = VERSION_INFO.prerequisite[i];
											if (prerequisite.patch === VERSION_INFO.patch) {
												if (prerequisite.migration && Array.isArray(prerequisite.migration) && prerequisite.migration.length > 0) {
													output += "\tthis patch has migrate(s) prerequisite: " + prerequisite.migration.join(" - ");
												}
												if (prerequisite.older) {
													for (let i = 0; i < prerequisite.older.length; i++) {
														if (prerequisite.older[i].patches.includes(settings.releaseInfo.patch)) {
															output += "\tyour current patch has more migrate(s) prerequisite: " + prerequisite.older[i].migration.join(" - ");
														}
													}
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
	
	"restore": (args, callback) => {
		if (args.length !== 3) {
			return callback(null, "remote-installer update needs 3 arguments [backup || rollback] [ID] [configuration]");
		}
		if (args.length === 0) {
			return callback(null, "Missing restore from what");
		}
		let fromWhat = args[0];
		args.shift();
		
		let fromWhatAvailable = ["backup", "rollback"];
		if (!fromWhatAvailable.includes(fromWhat)) {
			return callback('Restore from what only supports the following: ' + fromWhatAvailable.join(", "));
		}
		
		let fromID = args[0];
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
				let filePath = process.env.PWD + "/../etc/" + fromWhat + "/" + fromID + "/";
				fs.stat(filePath, (error, stats) => {
					if (error) {
						return callback(error);
					}
					if (!stats) {
						return callback('Unable to read from the folder: ' + filePath);
					}
					if (fromWhat === "rollback") {
						lib.restore(options, filePath, (error) => {
							return callback(error);
						});
					} else {
						fs.readdir(filePath, (error, directories) => {
							async.each(directories, (dir, cb) => {
								fs.stat(filePath + dir, (error, stats) => {
									if (!error && stats && stats.isDirectory()) {
										let dirPath = filePath + dir + "/";
										lib.restore(options, dirPath, (error) => {
											return cb(error);
										});
									} else {
										//skip files
										logger.debug("skipping: " + filePath + dir);
										return cb();
									}
								})
							}, (error) => {
								return callback(error);
							});
						});
					}
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
				
				remote_installer.getSettings(options, (error, settings) => {
					if (error) {
						return callback(error);
					}
					
					if (!settings || !settings.releaseInfo) {
						return callback("COntact SOAJS Team, something is wrong with the installed version, missing settings");
					}
					
					//NOTE: you can only update within the same patch and release
					let VERSION_INFO = versionInfo.getVersionInfo(settings.releaseInfo.name, settings.releaseInfo.patch);
					if (!VERSION_INFO || !VERSION_INFO.services) {
						return callback("COntact SOAJS Team, something is wrong with the installed version, missing services");
					}
					options.versions = VERSION_INFO;
					
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
	},
	
	"upgrade": (args, callback) => {
		if (args.length !== 2) {
			return callback(null, "remote-installer upgrade needs 2 arguments [patch || release] [configuration]");
		}
		if (args.length === 0) {
			return callback(null, "Missing service!");
		}
		let what2upgrade = args[0];
		args.shift();
		//let whatAvailable = ["patch", "release"];
		let whatAvailable = ["patch"];
		if (!whatAvailable.includes(what2upgrade)) {
			return callback('upgrade only supports the following: ' + whatAvailable.join(", "));
		}
		lib.getUserConfiguration(args[0], (error, userConfiguration) => {
			if (error) {
				return callback(error);
			}
			let cleanDataBefore = false;
			lib.getOptions(userConfiguration, cleanDataBefore, (error, options) => {
				if (error) {
					return callback(error);
				}
				
				return callback(null, "Coming soon!");
			});
		});
	}
};

module.exports = serviceModule;