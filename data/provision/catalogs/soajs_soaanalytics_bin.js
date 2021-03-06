'use strict';

let doc = {
	"_id": "5f0a3a7852b19b0a86f9daf3",
	"name": "SOA Analytics from bin",
	"type": "soajs",
	"subtype": "addon",
	"description": "Deploy SOA Analytics from binary",
	"recipe": {
		"deployOptions": {
			"image": {
				"prefix": "herrontech",
				"name": "soaanalytics",
				"tag": "1.x",
				"pullPolicy": "Always",
				"repositoryType": "public",
				"binary": true,
				"override": true
			},
			"sourceCode": {},
			"readinessProbe": {
				"httpGet": {
					"path": "/heartbeat",
					"port": "maintenance"
				},
				"initialDelaySeconds": 5,
				"timeoutSeconds": 2,
				"periodSeconds": 5,
				"successThreshold": 1,
				"failureThreshold": 3
			},
			"ports": [],
			"voluming": [],
			"restartPolicy": {
				"condition": "any",
				"maxAttempts": 5
			},
			"container": {
				"network": "soajsnet"
			}
		},
		"buildOptions": {
			"env": {
				"SOAJS_ENV": {
					"type": "computed",
					"value": "$SOAJS_ENV"
				},
				"SOAJS_DEPLOY_HA": {
					"type": "computed",
					"value": "$SOAJS_DEPLOY_HA"
				},
				"SOAJS_MONGO_CON_KEEPALIVE": {
					"type": "static",
					"value": "true"
				},
				"SOAJS_BCRYPT": {
					"type": "static",
					"value": "true"
				},
				"SOAJS_REGISTRY_API": {
					"type": "computed",
					"value": "$SOAJS_REGISTRY_API"
				},
				"SOAJS_LICENSE": {
					"type": "userInput",
					"label": "SOAJS License",
					"default": 'XXXXXXX',
					"fieldMsg": "Enter the SOAJS license."
				}
			},
			"settings": {},
			"cmd": {
				"deploy": {
					"command": [
						"bash"
					],
					"args": [
						"-c",
						"./soaanalytics.bin"
					]
				}
			}
		}
	},
	"v": 1,
	"ts": new Date().getTime()
};
module.exports = doc;