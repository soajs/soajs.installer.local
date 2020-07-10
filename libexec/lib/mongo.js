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
const YAML = require("yamljs");
const mkdirp = require("mkdirp");
let Mongo = require("soajs").mongo;
const custom = require("../custom/index.js");
let installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));

function getInstalledVersion() {
	if (installerConfig && installerConfig.version) {
		return installerConfig.version;
	}
	return null;
}

//set the logger
const logger = require("../utils/utils.js").getLogger();

function ifNotSudo(callback) {
	if (process.env.PLATFORM === 'Linux' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as Root!\n";
		return callback(output);
	}
	else if (process.env.PLATFORM === 'Darwin' && process.env.LOGNAME !== 'root') {
		let output = "This command requires you run it as: sudo soajs mongo " + process.env.SOAJS_INSTALLER_COMMAND;
		return callback(output);
	}
}

//mongo commands
let mongoModule = {
	/**
	 * build the soajs_mongo.conf file based on the operating system running the installer on
	 * @param args
	 * @param callback
	 */
	install: (args, callback) => {
		let config = {
			"systemLog": {
				"destination": "file",
				"logAppend": true
			},
			"storage": {
				"journal": {
					"enabled": true
				}
			},
			"processManagement": {
				"fork": true
			},
			"net": {
				"bindIp": "0.0.0.0",
				"port": 32017
			}
		};
		let logPath;
		
		//set mongo db data and log folder depending on platform
		if (process.env.PLATFORM === 'Darwin') {
			config.systemLog.path = "/usr/local/var/log/soajs/mongodb/mongo.log";
			config.storage.dbPath = "/usr/local/var/soajs/mongodb";
			logPath = '/usr/local/var/log/soajs/mongodb/';
		}
		else if (process.env.PLATFORM === 'Linux') {
			config.systemLog.path = "/var/log/soajs/mongodb/mongo.log";
			config.storage.dbPath = "/var/soajs/mongodb";
			logPath = '/var/log/soajs/mongodb';
		}
		//convert from json to yaml
		let yamlFile = YAML.stringify(config, 4);
		let mongoDbConf = path.normalize(process.env.PWD + "/../include/" + process.env.MONGO_LOCATION);
		
		//check if log path is found
		checkFile(logPath, () => {
			
			//check if db path is  found
			checkFile(config.storage.dbPath, () => {
				
				//write the path
				fs.writeFile(mongoDbConf + "/mongod.conf", yamlFile, (error) => {
					if (error) {
						return callback(error);
					}
					return callback(null, `MongoDB conf file has been created at ${mongoDbConf}/mongod.conf`);
				});
			});
		});
		
		//check if directory for mongo log files is found
		function checkFile(path, cb) {
			fs.stat(path, (error) => {
				if (error) {
					//if not found create the directories needed recursively
					mkdirp(path, cb);
				}
				else {
					cb();
				}
			});
		}
	},
	
	/**
	 * Start mongoDB server
	 * @param args
	 * @param callback
	 */
	start: (args, callback) => {
		
		ifNotSudo(callback);
		
		let mongoDbConf = path.normalize(process.env.PWD + "/../include/" + process.env.MONGO_LOCATION + "/mongod.conf");
		
		//check ig mongo.conf is found
		fs.stat(mongoDbConf, (error) => {
			if (error) {
				return callback(null, `MongoDB configuration file not found. Run [soajs mongo install] to create one.`);
			}
			let mongoPath = process.env.PWD + "/../include/" + process.env.MONGO_LOCATION + "/bin/mongod";
			const startMongo = spawn("sudo", [mongoPath, `--config=${mongoDbConf}`],
				{
					detached: true,
					"stdio": ['ignore', 'ignore', 'ignore']
				});
			startMongo.unref();
			
			let mongoJSONConfig = YAML.load(mongoDbConf);
			callback(null, `MongoDB Started and is listening on ${mongoJSONConfig.net.bindIp}, port: ${mongoJSONConfig.net.port}`);
		});
	},
	
	/**
	 * Stop mongoDB server
	 * @param args
	 * @param callback
	 */
	stop: (args, callback) => {
		let mongoDbConf = path.normalize(process.env.PWD + "/../include/" + process.env.MONGO_LOCATION);
		
		//check if there is a running process for the requested
		exec(`ps aux | grep ${mongoDbConf}`, (error, cmdOutput) => {
			if (error || !cmdOutput) {
				return callback();
			}
			
			//go through the returned output and find the process ID
			cmdOutput = cmdOutput.split("\n");
			
			if (Array.isArray(cmdOutput) && cmdOutput.length > 0) {
				let PID = null;
				cmdOutput.forEach((oneCMDLine) => {
					if (oneCMDLine.includes(`--config=${mongoDbConf}/mongod.conf`)) {
						let oneProcess = oneCMDLine.replace(/\s+/g, ' ').split(' ');
						PID = oneProcess[1];
					}
				});
				//if no PID return, nothing to do
				if (!PID) {
					return callback();
				}
				
				//stop the running process
				exec(`sudo kill -9 ${PID}`, (error) => {
					if (error) {
						return callback(error);
					}
					else {
						return callback(null, `MongoDB Stoped ...`);
					}
				});
			}
			else {
				return callback();
			}
		});
	},
	
	/**
	 * Restart mongoDB server
	 * @param args
	 * @param callback
	 */
	restart: (args, callback) => {
		
		//stop mongodb
		mongoModule.stop(args, (err) => {
			if (err) {
				return callback(err);
			}
			
			setTimeout(() => {
				//start mongodb
				mongoModule.start(args, callback);
			}, 1000);
		});
	},
	
	/**
	 * Set port for mongoDB
	 * change value in profile
	 * change value in mongo.conf
	 * @param args
	 * @param callback
	 * @returns {*}
	 */
	setPort: (args, callback) => {
		//todo check args
		if (!Array.isArray(args) || args.length === 0) {
			return callback(null, "Missing port value!");
		}
		if (args.length > 1) {
			args.shift();
			return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs mongo setPort %number%.`);
		}
		let portNumber;
		
		// check if port is number
		try {
			portNumber = parseInt(args[0]);
			if (typeof portNumber !== "number" || isNaN(portNumber)) {
				return callback(null, `Port value should be of type number...`);
			}
		}
		catch (e) {
			return callback(null, `Port value should be of type number...`);
		}
		let mongoDbConf = path.normalize(process.env.PWD + "/../include/" + process.env.MONGO_LOCATION + "/mongod.conf");
		
		//check if mongo.conf exists
		fs.stat(mongoDbConf, (error) => {
			if (error) {
				return callback(null, 'MongoDB configuration file not found. Run [soajs mongo install] to create one.');
			}
			let mongoConf;
			
			//read mongo.conf file
			fs.readFile(mongoDbConf, 'utf8', function read(err, data) {
				if (err) {
					return callback(null, 'MongoDB configuration file not found. Run [soajs mongo install] to create one.');
				}
				try {
					//transform yaml file to json
					mongoConf = YAML.parse(data);
				}
				catch (e) {
					return callback(null, `Malformed ${mongoDbConf}!`);
				}
				//change port value
				if (mongoConf.net && mongoConf.net.port) {
					mongoConf.net.port = portNumber;
				}
				//change data back yaml
				let yamlFile = YAML.stringify(mongoConf, 4);
				
				//write the file back
				fs.writeFile(mongoDbConf, yamlFile, (error) => {
					if (error) {
						return callback(error);
					}
					//call command to change the port
					let profileModule = require("./profile");
					profileModule.setPort(args, callback);
				});
			});
		});
	},
	
	/**
	 * Clean all soajs data from mongo
	 * core_provision && DBTN_urac are dropped
	 * @param args
	 * @param callback
	 */
	clean: (args, callback) => {
		//get profile path
		let profilePath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
		
		//check if profile is found
		fs.stat(profilePath, (error) => {
			if (error) {
				return callback(null, 'Profile not found!');
			}
			
			//read  mongo profile file
			let profile = require(profilePath);
			
			//use soajs.core.modules to create a connection to core_provision database
			let mongoConnection = new Mongo(profile);
			
			//drop core_provision database
			mongoConnection.dropDatabase((err) => {
				if (err) {
					return callback(err);
				}
				else {
					//close mongo connection
					mongoConnection.closeDb();
					
					//switch profile DBTN_urac
					profile.name = "DBTN_urac";
					
					//use soajs.core.modules to create a connection to DBTN_urac database
					mongoConnection = new Mongo(profile);
					
					//drop DBTN_urac database
					mongoConnection.dropDatabase((err) => {
						if (err) {
							return callback(err);
						}
						else {
							//close mongo connection
							mongoConnection.closeDb();
							return callback(null, "MongoDB SOAJS data has been removed...");
						}
					});
				}
			});
		});
	},
	
	/**
	 * Migrate soajs provision data
	 * @param args
	 * @param callback
	 */
	migrate: (args, callback) => {
		//todo check args
		if (!Array.isArray(args) || args.length === 0) {
			return callback(null, "Missing migration strategy!");
		}
		let strategies = require("../migrate/config.js");
		
		if (args.length > 1) {
			args.shift();
			return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs mongo migrate %strategy%.`);
		}
		
		// check if strategy is available
		let strategy = args[0];
		if (strategies.indexOf(strategy) === -1) {
			return callback(null, `Select one of the following strategies: ${strategies.join(" ")}.`);
		}
		let strategyFunction = require("../migrate/" + strategy + ".js");
		let profilePath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
		let dataPath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/provision/");
		return strategyFunction(profilePath, dataPath, callback);
	},
	
	getEnv: (args, callback) => {
		if (!Array.isArray(args) || args.length === 0) {
			return callback(null, "Missing what environment!");
		}
		let env = args[0].toUpperCase();
		//get profile path
		let profilePath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
		
		//check if profile is found
		fs.stat(profilePath, (error) => {
			if (error) {
				return callback(null, 'Profile not found!');
			}
			
			//read  mongo profile file
			let profile = require(profilePath);
			
			//use soajs.core.modules to create a connection to core_provision database
			let mongoConnection = new Mongo(profile);
			let condition = {"code": env};
			mongoConnection.findOne("environment", condition, null, (err, record) => {
				return callback(err, record);
			});
			
		});
	},
	
	getControllerPort: (args, callback) => {
		mongoModule.getEnv(args, (error, envRecord) => {
			if (error) {
				return callback(error);
			}
			if (envRecord && envRecord.services && envRecord.services.config && envRecord.services.config.ports && envRecord.services.config.ports.controller) {
				return callback(null, envRecord.services.config.ports);
			} else {
				setTimeout(() => {
					mongoModule.getEnv(args, (error, envRecord) => {
						if (error) {
							return callback(error);
						}
						if (envRecord && envRecord.services && envRecord.services.config && envRecord.services.config.ports && envRecord.services.config.ports.controller) {
							return callback(null, envRecord.services.config.ports);
						} else {
							return callback(new Error("Unable to find gateway port for environment [" + args[0] + "]"));
						}
					});
				}, 5000);
			}
		});
	},
	
	custom: (args, callback) => {
		if (!Array.isArray(args) || args.length === 0) {
			return callback(null, "Missing custom folder!");
		}
		if (args.length > 2) {
			args.shift();
			return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs mongo custom %folder% [--clean].`);
		}
		if (args[0].charAt(0) !== '/') {
			return callback("Invalid custom folder; please provide an absolute custom folder path. Ex: sudo soajs mongo custom /%folder% [--clean].");
		}
		let cleanDataBefore = false;
		if (args.length === 2) {
			if (args[1] === "--clean") {
				cleanDataBefore = true;
			}
			else {
				args.shift();
				return callback(null, `Unidentified input ${args.join(" ")}. Please use soajs mongo custom %folder% [--clean].`);
			}
		}
		let dataPath = args[0];
		if (dataPath.charAt(dataPath.length - 1) !== '/') {
			dataPath = dataPath + '/';
		}
		if (fs.existsSync(dataPath)) {
			let profilePath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
			
			let soa_json = path.normalize(dataPath + "/soa.json");
			fs.stat(soa_json, (error) => {
				if (error) {
					return custom.runPath(profilePath, dataPath, cleanDataBefore, null, callback, getInstalledVersion());
				} else {
					let soa = require(soa_json);
					let run_for_custom = () => {
						if (soa && soa.custom) {
							let customPath = path.normalize(dataPath + soa.custom + "/");
							if (fs.existsSync(customPath)) {
								custom.runGeneric(profilePath, customPath, cleanDataBefore, (error) => {
									if (error) {
										if (error.message) {
											logger.error(error.message);
										} else {
											logger.error(error);
										}
									}
									return callback(null, 'MongoDb Soajs Data generic done!');
								});
							} else {
								return callback(null, `Custom folder [${customPath}] not found!`);
							}
						} else {
							return callback(null, 'Nothing to run for! Make sure either base or custom are set.');
						}
					};
					if (soa && soa.base) {
						let basePath = path.normalize(dataPath + soa.base + "/");
						if (fs.existsSync(basePath)) {
							custom.runPath(profilePath, basePath, cleanDataBefore, null, (error) => {
								if (error) {
									if (error.message) {
										logger.error(error.message);
									} else {
										logger.error(error);
									}
								}
								run_for_custom();
							}, getInstalledVersion());
						} else {
							return callback(null, `Base folder [${basePath}] not found!`);
						}
					} else {
						run_for_custom();
					}
				}
			});
		}
		else {
			return callback(null, `Custom folder [${dataPath}] not found!`);
		}
	},
	
	/**
	 * Replace soajs provision data with a fresh new copy
	 * @param args
	 * @param callback
	 */
	patch: (args, callback) => {
		let workingDirectory = installerConfig.workingDirectory;
		let profilePath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/soajs_profile.js");
		let dataPath = path.normalize(process.env.PWD + "/../soajs.installer.local/data/provision/");
		let cleanDataBefore = false;
		
		let tenantFn = (doc) => {
			if (doc && doc.applications && Array.isArray(doc.applications) && doc.applications.length > 0) {
				for (let appIndex = 0; appIndex < doc.applications.length; appIndex++) {
					if (doc.applications[appIndex].product === "DSBRD") {
						let keys = doc.applications[appIndex].keys;
						for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
							if (keys[keyIndex].config && keys[keyIndex].config.dashboard && keys[keyIndex].config.dashboard.urac && keys[keyIndex].config.dashboard.urac.mail) {
								for (let operation in keys[keyIndex].config.dashboard.urac.mail) {
									if (keys[keyIndex].config.dashboard.urac.mail.hasOwnProperty(operation)) {
										keys[keyIndex].config.dashboard.urac.mail[operation].path = keys[keyIndex].config.dashboard.urac.mail[operation].path.replace("%wrkDir%", workingDirectory);
									}
								}
							}
						}
					}
				}
			}
		};
		let resourceFn = (doc) => {
			doc.config = require(profilePath);
		};
		
		return custom.runPath(profilePath, dataPath, cleanDataBefore, {
			"tenants": tenantFn,
			"resources": resourceFn
		}, callback, getInstalledVersion());
	}
};

module.exports = mongoModule;
