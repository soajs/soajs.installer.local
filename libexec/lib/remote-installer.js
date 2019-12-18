'use strict';

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
					remote_installer.getDeployment(options, (error, deployments) => {
						if (error) {
							return callback(error);
						}
						
						let output = "\nSOAJS Remote Release Information:\n";
						
						output += "\n=======================\n";
						output += "Your current installed release is: [" + settings.releaseInfo.name + "] and patch [" + settings.releaseInfo.patch + "]\n";
						
						output += "The microservices versions:\n";
						
						for (let i = 0; i < deployments.services.length; i++) {
							output += "\t" + deployments.services[i].serviceName + ": " + deployments.services[i].image;
							if (deployments.services[i].branch) {
								output += " - " + deployments.services[i].branch;
							}
							output += "\n";
						}
						
						output += "\n=======================\n";
						output += "Updates:\n";
						
						let releaseInfo = versionInfo.getVersionInfo(settings.releaseInfo.name);
						let latest = versionInfo.getLatest();
						if (settings.releaseInfo.name === latest) {
							output += "\tcurrently you are using the latest release.\n\n";
							if (settings.releaseInfo.patch === releaseInfo.patch) {
								//check the service sem version !!!!
								if (deployments.info.style === "sem") {
									
									output += "\teverything is up-to-date, enjoy!\n";
								} else {
									output += "\ta SOAJS deployment of style [" + deployments.info.style + "] detected.\n";
									output += "\teverything might be up-to-date, contact soajs for more information!\n";
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
	
	/**
	 * Migrate soajs provision data
	 * @param args
	 * @param callback
	 */
	migrate: (args, callback) => {
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