"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const packagejson = require("../../../package.json");
const local_packagejson = require("../../package.json");
const remote_packagejson = require("../../../soajs.installer.remote/package.json");
const versions_packagejson = require("../../../soajs.installer.versions/package.json");

const helpModule = {
	/**
	 * Displays the SOAJS installer manual
	 * @param args
	 * @param callback
	 * @returns {*}
	 */
	go: (args, callback) => {
		let output = "\nSOAJS Installer:\n";
		
		output += "\n=======================\n\n";
		
		output += "Usage: soajs MODULE OPERATION [PARAMs ...]\n\n";
		
		output += "Available MODULES:\n";
		output += "   console\n";
		output += "   release\n";
		output += "   mongo\n";
		output += "   service\n";
		output += "   services\n";
		output += "   profile\n";
		output += "   kubernetes\n";
		output += "   remote-installer\n\n";
		
		let manual = {
			"console Operations": {
				"install": "Configures & starts mongodb server, patches the SOAJS sample data, installs and starts the SOAJS Console",
				"update": "Stops SOAJS Console, updates all the Console Microservices and starts the SOAJS Console",
				"remove": "Stops SOAJS Console, stops MongoDB server and deletes all the downloaded Console Microservices",
				"start": "Starts all the Microservices of the SOAJS Console",
				"stop": "Stops all the Microservices of the SOAJS Console",
				"restart": "Restarts all the Microservices of the SOAJS Console",
				"setHost": "Updates the console server host domain"
			},
			"release Operations": {
				"info": "Return information about the installed release and if updates are available",
			},
			"mongo Operations": {
				"install": "Creates the MongoDB configuration file and updates the SOAJS profile",
				"start": "Starts MongoDB server",
				"stop": "Stops MongoDB server",
				"restart": "Restarts MongoDB server",
				"setPort": "Changes the default MongoDB server port and updates the SOAJS profile",
				"clean": "Removes all the databases of SOAJS sample data from the MongoDB server",
				"patch": "Imports the SOAJS sample data into MongoDB server and creates all the needed databases",
				"migrate": "Migrate SOAJS data to update from an old version to a new version when needed",
				"custom": "Import soajs & custom ready data"
			},
			"service Operations": {
				"start": "Start a SOAJS Service i.e. [gateway|urac|dashboard|oauth|multitenant]",
				"stop": "Stop a SOAJS Service i.e. [gateway|urac|dashboard|oauth|multitenant]",
				"restart": "reStart a SOAJS Service i.e. [gateway|urac|dashboard|oauth|multitenant]",
				"install": "Install a SOAJS Services i.e. [gateway|urac|oauth|multitenant]"
			},
			"services Operations": {
				"start": "Start all SOAJS Services i.e. [gateway|urac|oauth|multitenant]",
				"stop": "Stop all SOAJS Services i.e. [gateway|urac|oauth|multitenant]",
				"restart": "reStart all SOAJS Services i.e. [gateway|urac|oauth|multitenant]"
			},
			"profile Operations": {
				"setPort": "Updates the MongoDB server port in the SOAJS profile",
				"setHost": "Updates the MongoDB server host in the SOAJS profile"
			},
			"kubernetes Operations": {
				"connect": "Configures and displays how to connect to Kubernetes on your machine"
			},
			"remote-installer Operations": {
				"install": "Starts the SOAJS Remote Cloud Installer"
			}
		};
		
		for (let section in manual) {
			if (manual.hasOwnProperty(section)) {
				output += `${section}:\n`;
				
				let commands = manual[section];
				for (let command in commands) {
					if (commands.hasOwnProperty(command)) {
						output += `${command}\t\t${commands[command]}\n`;
					}
				}
				output += "\n";
			}
		}
		
		output += "\n";
		output += "Refer to README.md file for more details about the commands and their arguments.";
		output += "\n";
		
		output += "\n=======================\n";
		output += "SOAJS Installer Versions:\n";
		
		output += "   Installer package  [" + packagejson.version + "]\n";
		output += "   Installer local    [" + local_packagejson.version + "]\n";
		output += "   Installer remote   [" + remote_packagejson.version + "]\n";
		output += "   Installer versions [" + versions_packagejson.version + "]\n";
		
		//print and return
		console.log(output);
		return callback();
	}
};

module.exports = helpModule;