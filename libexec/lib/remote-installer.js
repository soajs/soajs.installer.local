'use strict';

const path = require("path");
const fs = require("fs");
const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));
const remote_installer = require(path.normalize(process.env.PWD + "/../soajs.installer.remote/libexec/index.js"));

//set the logger
const logger = require("../utils/utils.js").getLogger();

const serviceModule = {
	
	'install': (args, callback) => {
		logger.info(`SOAJS Remote Cloud Installer started ...`);
		if (args.length === 0) {
			return callback("Please provide remote installer configuration... for more information PLease contact SOAJS @ https://www.soajs.org/contactUs");
		}
		fs.stat(args[0], (error, stats) => {
			if (error || !stats) {
				return callback("Unable find remote installer configuration (might be permissions): " + args[0]);
			}
			fs.readFile(args[0], (error, userConfiguration) => {
				if (error || !userConfiguration) {
					return callback("Unable read remote installer configuration (might be permissions): " + args[0]);
				}
				try {
					userConfiguration = JSON.parse(userConfiguration);
				} catch (e) {
					return callback("Unable parse remote installer configuration (might be permissions): " + args[0]);
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
				
				let VERSION_INFO = versionInfo.getVersionInfo();
				if (!VERSION_INFO || !VERSION_INFO.services) {
					return callback("Unable continue, missing installer versions information!");
				}
				let dataPath = path.normalize(process.env.PWD + "/../soajs.installer.remote/data/provision/");
				let options = {
					"versions": VERSION_INFO,
					
					"cleanDataBefore": cleanDataBefore,
					
					"driverName": "kubernetes",
					"dataPath": dataPath,
					"importer": require('./../custom/index.js'),
					
					"mongo": userConfiguration.mongo,
					"kubernetes": userConfiguration.kubernetes,
					"nginx": userConfiguration.nginx,
					"owner": userConfiguration.owner,
					
					"type": userConfiguration.type || "bin"
				};
				remote_installer.install(options, (error) => {
					return callback(error, "SOAJS remote installer done!");
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
		let strategies =  require(path.normalize(process.env.PWD + "/../soajs.installer.remote/libexec/migrate/config.js"));
		let strategy = args[0];
		
		if (strategies.indexOf(strategy) === -1) {
			return callback(null, `Select one of the following strategies: ${strategies.join(" ")}.`);
		}
		args.shift();
		
		if (args.length === 0) {
			return callback("Please provide remote installer configuration... for more information PLease contact SOAJS @ https://www.soajs.org/contactUs");
		}
		fs.stat(args[0], (error, stats) => {
			if (error || !stats) {
				return callback("Unable find remote installer configuration (might be permissions): " + args[0]);
			}
			fs.readFile(args[0], (error, userConfiguration) => {
				if (error || !userConfiguration) {
					return callback("Unable read remote installer configuration (might be permissions): " + args[0]);
				}
				try {
					userConfiguration = JSON.parse(userConfiguration);
				} catch (e) {
					return callback("Unable parse remote installer configuration (might be permissions): " + args[0]);
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
				
				let VERSION_INFO = versionInfo.getVersionInfo();
				if (!VERSION_INFO || !VERSION_INFO.services) {
					return callback("Unable continue, missing installer versions information!");
				}
				let dataPath = path.normalize(process.env.PWD + "/../soajs.installer.remote/data/provision/");
				let options = {
					"versions": VERSION_INFO,
					
					"cleanDataBefore": cleanDataBefore,
					
					"driverName": "kubernetes",
					"dataPath": dataPath,
					"importer": require('./../custom/index.js'),
					
					"mongo": userConfiguration.mongo,
					"kubernetes": userConfiguration.kubernetes,
					"nginx": userConfiguration.nginx,
					"owner": userConfiguration.owner,
					
					"deployment": userConfiguration.deployment || null
				};
				
				remote_installer.migrate(options, strategy, (error, response) => {
					
					return callback(error, response);
				});
			});
		});
	}
};

module.exports = serviceModule;