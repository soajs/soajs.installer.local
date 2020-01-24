'use strict';

let request = require("request");
const path = require("path");

const packagejson = require(path.normalize(process.env.PWD + "/../package.json"));
const local_packagejson = require(process.env.PWD + "/../soajs.installer.local/package.json");
const remote_packagejson = require(process.env.PWD + "/../soajs.installer.remote/package.json");
const versions_packagejson = require(process.env.PWD + "/../soajs.installer.versions/package.json");

let installerBinVersion = packagejson.version;
let installerLocalVersion = local_packagejson.version;
let installerRemoteVersion = remote_packagejson.version;
let installerReleaseVersion = versions_packagejson.version;

const installerConfig = require(path.normalize(process.env.PWD + "/../etc/config.js"));

const versionInfo = require(path.normalize(process.env.PWD + "/../soajs.installer.versions/index.js"));

const async = require("async");
const fs = require("fs");

function getInstallerVersions(cb) {
	let fetchLastVersion = (version, uri, callback) => {
		let method = "get";
		let options = {
			uri: uri,
			method: method.toUpperCase(),
			json: true
		};
		request[method](options, function (error, response, body) {
			let nVer = null;
			if (body && body.version) {
				nVer = body.version;
			}
			if (nVer && nVer === version) {
				return callback(null, true, nVer);
			}
			return callback(null, false, nVer);
		});
	};
	let output = "";
	let binaryNeedUpdate = false;
	let codeNeedUpdate = false;
	fetchLastVersion(installerBinVersion, 'https://raw.githubusercontent.com/soajs/soajs.installer/master/package.json', (error, good, nVer) => {
		if (!good) {
			binaryNeedUpdate = true;
			output += "\tsoajs.installer  " + installerBinVersion + " --> " + nVer + " not up-to-date\n";
		}
		fetchLastVersion(installerLocalVersion, 'https://raw.githubusercontent.com/soajs/soajs.installer.local/master/package.json', (error, good, nVer) => {
			if (!good) {
				codeNeedUpdate = true;
				output += "\tsoajs.installer.local  " + installerLocalVersion + " --> " + nVer + " not up-to-date\n";
			}
			fetchLastVersion(installerRemoteVersion, 'https://raw.githubusercontent.com/soajs/soajs.installer.remote/master/package.json', (error, good, nVer) => {
				if (!good) {
					codeNeedUpdate = true;
					output += "\tsoajs.installer.remote  " + installerRemoteVersion + " --> " + nVer + " not up-to-date\n";
				}
				fetchLastVersion(installerReleaseVersion, 'https://raw.githubusercontent.com/soajs/soajs.installer.versions/master/package.json', (error, good, nVer) => {
					if (!good) {
						codeNeedUpdate = true;
						output += "\tsoajs.installer.versions  " + installerReleaseVersion + " --> " + nVer + " not up-to-date\n";
					}
					if (output !== "") {
						output = "\nSOAJS Installer Information:\n=======================\n" + output;
						
						if (codeNeedUpdate) {
							output += "\n\tkindly run [" + process.env.PWD.substr(0, process.env.PWD.lastIndexOf("/")) + "/INSTALL] to update installer code.\n";
						}
						if (binaryNeedUpdate) {
							output += "\n\tkindly go to [https://soajsorg.atlassian.net/wiki/spaces/IN/pages/1427472397/Update+Installer] to update installer binary.\n";
						}
						console.log(output);
					}
					return cb();
				});
			});
		});
	});
}

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

let getmsVersion = (cb) => {
	let VERSION_INFO = versionInfo.getVersionInfo(installerConfig.version, installerConfig.patch);
	if (!VERSION_INFO || !VERSION_INFO.services) {
		return cb("Unable to get release information for the installed version [" + installerConfig.version + " " + installerConfig.patch + "]");
	}
	let msVersions = [];
	let up2date = true;
	async.eachOfSeries(VERSION_INFO.services, (oneServiceInfo, oneService, mCb) => {
		let oneRepo = oneServiceInfo.repo;
		let packageJSONPath = installerConfig.workingDirectory + "/node_modules/" + oneRepo + "/package.json";
		fs.stat(packageJSONPath, (error, stats) => {
			if (error || !stats) {
				return mCb();
			} else {
				let packageJSON = require(packageJSONPath);
				if (VERSION_INFO.services[oneService].semVer === packageJSON.version) {
					msVersions.push(oneService + " " + packageJSON.version);
				} else {
					up2date = false;
					msVersions.push(oneService + " " + packageJSON.version + " --> " + VERSION_INFO.services[oneService].semVer + " : NOT up-to-date!");
				}
				return mCb();
			}
		});
	}, (error) => {
		if (error) {
			return cb(error);
		}
		return cb(null, msVersions, up2date);
	});
	
};

const servicesModule = {
	
	/**
	 * This function returns soajs release information
	 * @param args {Array}
	 * @param callback {Function}
	 */
	'info': (args, callback) => {
		getInstallerVersions(() => {
			ifNotSudo(callback);
			
			let releaseInfo = getInstalledVersion();
			
			let output = "\nSOAJS Release Information:\n";
			
			output += "\n=======================\n";
			output += "Your current installed release is: [" + releaseInfo.current.version + "] and patch [" + releaseInfo.current.patch + "]\n";
			
			output += "The microservices versions:\n";
			getmsVersion((error, msVersions, up2date) => {
				
				if (error) {
					output += "\t Unable to  get versions information at this time.\n";
				}
				if (msVersions && msVersions.length > 0) {
					output += "\t" + msVersions.join(" \n\t");
				}
				
				output += "\n=======================\n";
				output += "Updates:\n";
				
				let latest = versionInfo.getLatest();
				if (releaseInfo.current.version) {
					if (releaseInfo.current.version === latest) {
						output += "\tcurrently you are using the latest release.\n\n";
						if (releaseInfo.current.patch) {
							if (releaseInfo.current.patch === releaseInfo.release.patch) {
								if (up2date) {
									output += "\teverything is up-to-date, enjoy!\n";
								} else {
									output += "\tnot everything is up-to-date!\n";
								}
							} else {
								if (releaseInfo.release.previousPatches.includes(releaseInfo.current.patch)) {
									output += "\tyou do not have the latest patch, the latest patch is: [" + releaseInfo.release.patch + "].\n";
									output += "\tkindly run [sudo soajs console update] to update to the latest patch.\n";
									if (releaseInfo.release.prerequisite && Array.isArray(releaseInfo.release.prerequisite)) {
										for (let i = 0; i < releaseInfo.release.prerequisite.length; i++) {
											let prerequisite = releaseInfo.release.prerequisite[i];
											if (prerequisite.patch === releaseInfo.release.patch) {
												if (prerequisite.migration && Array.isArray(prerequisite.migration) && prerequisite.migration.length > 0) {
													output += "\tthis patch has migrate(s) prerequisite: \n\t\t sudo soajs mongo migrate " + prerequisite.migration.join(" \n\t\t sudo soajs mongo migrate ") + "\n";
												}
												if (prerequisite.older) {
													for (let i = 0; i < prerequisite.older.length; i++) {
														if (prerequisite.older[i].patches.includes(releaseInfo.current.patch)) {
															output += "\tyour current patch has more migrate(s) prerequisite: \n\t\t sudo soajs mongo migrate " + prerequisite.older[i].migration.join(" \n\t\t sudo soajs mongo migrate ") + "\n";
														}
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
				} else {
					output += "\tunable to find any information.\n";
				}
				
				console.log(output);
				
				return callback();
			});
		});
	}
	
};

module.exports = servicesModule;