"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const request = require("request");

const packagejson = require(process.env.PWD + "/../package.json");
const local_packagejson = require(process.env.PWD + "/../soajs.installer.local/package.json");
const remote_packagejson = require(process.env.PWD + "/../soajs.installer.remote/package.json");
const versions_packagejson = require(process.env.PWD + "/../soajs.installer.versions/package.json");

const installerBinVersion = packagejson.version;
const installerLocalVersion = local_packagejson.version;
const installerRemoteVersion = remote_packagejson.version;
const installerReleaseVersion = versions_packagejson.version;


module.exports = (cb) => {
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
						output = "\nSOAJS Installer Versions:\n=======================\n" + output;
						
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
};