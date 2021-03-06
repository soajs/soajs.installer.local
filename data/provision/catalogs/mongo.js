'use strict';

let doc = {
	"_id": "5df3ec10fa3912534948f003",
	"name": "Mongo DB",
	"type": "resource",
	"subtype": "mongo",
	"description": "Deploy single instance of Mongo DB",
	"locked": true,
	"recipe": {
		"deployOptions": {
			"image": {
				"prefix": "",
				"name": "mongo",
				"tag": "4.2.1",
				"pullPolicy": "Always",
				"repositoryType": "public",
				"binary": true,
				"override": true
			},
			"sourceCode": {},
			"readinessProbe": {
				"exec": {
					"command": ["mongo"],
					"args": ["--eval \"db.adminCommand('ping')\""]
				},
				"initialDelaySeconds": 5,
				"timeoutSeconds": 2,
				"periodSeconds": 5,
				"successThreshold": 1,
				"failureThreshold": 3
			},
			"restartPolicy": {
				"condition": "any",
				"maxAttempts": 5
			},
			"container": {
				"network": "soajsnet",
				"workingDir": ""
			},
			"voluming": [
				{
					"kubernetes": {
						"volume": {
							"name": "dashboard-soajsdata",
							"hostPath": {
								"path": "/var/data/db/"
							}
						},
						"volumeMount": {
							"mountPath": "/var/data/db/",
							"name": "dashboard-soajsdata"
						}
					}
				}
			],
			"ports": [
				{
					"name": "mongoport",
					"target": 27017
				}
			]
		},
		"buildOptions": {
			"env": {},
			"cmd": {
				"deploy": {
					"command": [
						"mongod"
					],
					"args": [
						"--bind_ip", "0.0.0.0"
					]
				}
			}
		}
	},
	"v": 1,
	"ts": new Date().getTime()
};
module.exports = doc;