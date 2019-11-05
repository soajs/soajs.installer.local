'use strict';

const path = require("path");

const installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));

const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));


function getInstalledVersion() {
	if (installerConfig && installerConfig.version) {
		return {"release": versionInfo.getVersionInfo(installerConfig.version), "current": installerConfig};
	}
	return null;
}

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
	 * This function returns soajs release information
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'info': (args, callback) => {
		
		ifNotSudo(callback);
		
		let releaseInfo = getInstalledVersion();
		
		let output = "\nSOAJS Release Information:\n";
		
		output += "\n=======================\n";
		output += "Your current installed release is: [" + releaseInfo.current.version + "] and patch [" + releaseInfo.current.patch + "]\n";
		
		output += "\n=======================\n";
		output += "Updates:\n";
		
		let latest = versionInfo.getLatest();
		if (releaseInfo.current.version) {
			if (releaseInfo.current.version === latest) {
				output += "\tcurrently you are using the latest release.\n\n";
				if (releaseInfo.current.patch) {
					if (releaseInfo.current.patch === releaseInfo.release.patch) {
						output += "\teverything is up-to-date, enjoy!\n";
					} else {
						if (releaseInfo.release.previousPatches.includes(releaseInfo.current.patch)) {
							output += "\tyou do not have the latest patch, the latest patch is: [" + releaseInfo.release.patch + "].\n";
							output += "\tkindly run [sudo soajs console update] to update to the latest patch.\n";
						}
					}
				}
			} else {
				output += "\tcurrently you not are using the latest release. [" + latest + "] is the latest release.\n";
				output += "\tplease contact soajs team for more information!\n";
			}
		} else {
			output += "\tunable to find any information.\n";
		}
		
		console.log(output);
		
		return callback();
	}
	
};

module.exports = servicesModule;