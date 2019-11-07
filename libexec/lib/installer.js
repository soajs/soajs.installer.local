'use strict';

const fs = require("fs");
const mkdirp = require("mkdirp");
const exec = require("child_process").exec;
const logger = require("../utils/utils.js").getLogger();

function runNPM(config, cb) {
	logger.debug(`Installing ${config.serviceName} version ${config.version} ...\n`);
	logger.debug(`sudo ${process.env.NPM_BIN} install ${config.pack}@${config.packVersion}`);
	
	let modInstall = exec(`sudo ${process.env.NPM_BIN} install ${config.pack}@${config.packVersion}`, {
		cwd: config.path
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
			logger.debug(`${config.serviceName} installed!\n`);
			setTimeout(() => {
				return cb(null, true);
			}, 1000);
		}
		else {
			return cb("Error installing " + config.serviceName + "!\n");
		}
	});
}

module.exports = {
	"npm": (installerConfig, config, cb) => {
		let myPath = installerConfig.workingDirectory + "/extra/" + config.serviceName + config.version + "/node_modules/";
		config.path = myPath;
		fs.stat(myPath, (error, stats) => {
			if (error) {
				if (error.code === 'ENOENT' && !stats) {
					//if not found create the directories needed recursively
					mkdirp(myPath, ()=>{
						runNPM(config, cb);
					});
				}
				else {
					return cb(error);
				}
			}
			else {
				runNPM(config, cb);
			}
		});
	}
};