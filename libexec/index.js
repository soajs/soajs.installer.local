"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

process.env.SOAJS_REGISTRY_API = "127.0.0.1:5000";

const path = require("path");
const semver = require('semver');

//set the logger
const logger = require("./utils/utils.js").getLogger();

//store the location of the soajs installer
process.env.SOAJS_INSTALLER_LOCATION = path.normalize(process.env.PWD + "/../");

//check soajs.installer binary version
let binaryVer = "4.1.0";
const packagejson = require(path.normalize(process.env.PWD + "/../package.json"));
const local_packagejson = require(process.env.PWD + "/../soajs.installer.local/package.json");
//const remote_packagejson = require(process.env.PWD + "/../soajs.installer.remote/package.json");
//const versions_packagejson = require(process.env.PWD + "/../soajs.installer.versions/package.json");

let installerBinVersion = packagejson.version;
let installerLocalVersion = local_packagejson.version;

if (semver.lt(installerBinVersion, binaryVer)) {
	logger.error(`Installer binary is outdated at least version [${binaryVer}] of soajs.installer must be installed.`);
	logger.info("To learn how to upgrade installer binary, check out section 1 [installer binary update] at this link:");
	logger.info("https://soajsorg.atlassian.net/wiki/spaces/IN/pages/1427472397/Update+Installer");
	process.exit();
}
let localVer = "3.0.12";
if (semver.lt(installerLocalVersion, localVer)) {
	logger.error(`Installer code is outdated at least version [${localVer}] of soajs.installer.local must be installed.`);
	logger.info("To learn how to upgrade installer code, check out section 2 [installer code update] at this link:");
	logger.info("https://soajsorg.atlassian.net/wiki/spaces/IN/pages/1427472397/Update+Installer");
	process.exit();
}

//set the process arguments and remove the first 2, they are not needed
let processArguments = process.argv;
processArguments.shift();
processArguments.shift();

//find the correct module to load
let soajsModule;
let askedModule = processArguments[0];
switch (askedModule) {
	case 'mongo':
		soajsModule = "mongo.js";
		break;
	case 'release':
		soajsModule = "release.js";
		break;
	case 'profile':
		soajsModule = "profile.js";
		break;
	case 'service':
		soajsModule = "service.js";
		break;
	case 'services':
		soajsModule = "services.js";
		break;
	case 'console':
		soajsModule = "console.js";
		break;
	case 'kubernetes':
		soajsModule = "kubernetes.js";
		break;
	case 'remote-installer':
		soajsModule = "remote-installer.js";
		break;
	case '--help':
		soajsModule = "help.js";
		break;
}

//requested module is not supported
if (!soajsModule) {
	logger.error(`Unknown soajs MODULE "${askedModule}" !`);
	logger.info("Run 'soajs --help' for usage.");
	process.exit();
}

//remove the third argument, from here on it is not needed anymore
processArguments.shift();

//calculate and append node executable to process environment variables
let NodeLocation = path.normalize(process.env.PWD + `/../include/${process.env.NODE_LOCATION}/bin/node`);
process.env.NODE_BIN = NodeLocation;
let NPMLocation = path.normalize(process.env.PWD + `/../node_modules/npm/bin/npm-cli.js`);
process.env.NPM_BIN = NPMLocation;

//set the soajs module directory
let soajsModulesDirectory = path.normalize(process.env.PWD + `/../soajs.installer.local/libexec/lib/`);

let myModule = require(soajsModulesDirectory + soajsModule);
let commandRequested = processArguments[0];

//remove the argument that represents the command, no longer needed
processArguments.shift();

if (!Object.hasOwnProperty.call(myModule, commandRequested)) {
	if (soajsModule === 'help.js') {
		commandRequested = 'go';
	}
	else {
		logger.error(`Unknown command "${commandRequested}" for soajs "${askedModule}" !`);
		logger.info("Run 'soajs --help' for usage.");
		process.exit();
	}
}

//invoke the module requested
process.env.SOAJS_INSTALLER_COMMAND = commandRequested;
myModule[commandRequested](processArguments, (error, response) => {
	if (error) {
		if (error.message) {
			logger.error(error.message);
		} else {
			logger.error(error);
		}
	}
	else {
		if (response) {
			if (!response.includes("SOAJS Installer")) {
				logger.info(response);
			}
			else {
				console.log(response);
			}
		}
	}
	process.exit();
});
