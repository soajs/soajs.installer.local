'use strict';

let doc = {
	"_id": "5df3ec10fa3912534948f002",
	"name": "GoLang",
	"type": "api",
	"subtype": "golang",
	"description": "Deploy GoLang service",
	"locked": true,
	"recipe": {
		"deployOptions": {
			"image": {
				"shell": "/bin/sh",
				"prefix": "soajsorg",
				"name": "go",
				"tag": "3.x",
				"pullPolicy": "Always",
				"repositoryType": "public",
				"override": true
			},
			"sourceCode": {},
			"readinessProbe": {
				"httpGet": {
					"path": "/heartbeat",
					"port": "service"
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
				"network": "soajsnet",
				"workingDir": "/opt/soajs/soajs.deployer/deployer/"
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
				"SOAJS_DEPLOY_MANUAL": {
					"type": "static",
					"value": "false"
				},
				"SOAJS_REGISTRY_API": {
					"type": "computed",
					"value": "$SOAJS_REGISTRY_API"
				}
			},
			"settings": {},
			"cmd": {
				"deploy": {
					"command": [
						"sh"
					],
					"args": [
						"-c",
						"node . -T golang -S deploy",
						"node . -T golang -S install",
						"$SOAJS_GIT_REPO"
					]
				}
			}
		}
	},
	"v": 1,
	"ts": new Date().getTime()
};
module.exports = doc;