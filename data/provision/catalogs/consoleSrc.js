'use strict';

let doc = {
	"_id": "5dea9f00be70f13a183a9c71",
	"name": "Console UI source",
	"type": "server",
	"subtype": "nginx",
	"soajs": true,
	"description": "This recipe allows you to deploy a SOAJS Console UI  from source code",
	"restriction": {
		"deployment": [
			"container"
		]
	},
	"recipe": {
		"deployOptions": {
			"image": {
				"prefix": "soajsorg",
				"name": "consoleui",
				"tag": "2.x",
				"pullPolicy": "Always",
				"repositoryType": "public",
				"override": true
			},
			"sourceCode": {
				"custom": {
					"label": "Attach Custom UI",
					"type": "static",
					"repo": "",
					"branch": "",
					"required": false
				}
			},
			"certificates": "none",
			"readinessProbe": {
				"httpGet": {
					"path": "/",
					"port": "http"
				},
				"initialDelaySeconds": 5,
				"timeoutSeconds": 2,
				"periodSeconds": 5,
				"successThreshold": 1,
				"failureThreshold": 3
			},
			"ports": [
				{
					"name": "http",
					"target": 80,
					"isPublished": true,
					"preserveClientIP": true
				},
				{
					"name": "https",
					"target": 443,
					"isPublished": true,
					"preserveClientIP": true
				}
			],
			"voluming": [],
			"restartPolicy": {
				"condition": "any",
				"maxAttempts": 5
			},
			"container": {
				"network": "soajsnet",
				"workingDir": "/opt/soajs/soajs.deployer/deployer/"
			},
			"allowExposeServicePort": false
		},
		"buildOptions": {
			"env": {
				"SOAJS_ENV": {
					"type": "computed",
					"value": "$SOAJS_ENV"
				},
				
				"SOAJS_EXTKEY": {
					"type": "computed",
					"value": "$SOAJS_EXTKEY"
				},
				
				"SOAJS_NX_DOMAIN": {
					"type": "computed",
					"value": "$SOAJS_NX_DOMAIN"
				},
				"SOAJS_NX_API_DOMAIN": {
					"type": "computed",
					"value": "$SOAJS_NX_API_DOMAIN"
				},
				"SOAJS_NX_CONTROLLER_NB": {
					"type": "computed",
					"value": "$SOAJS_NX_CONTROLLER_NB"
				},
				"SOAJS_NX_CONTROLLER_IP": {
					"type": "computed",
					"value": "$SOAJS_NX_CONTROLLER_IP_N"
				},
				"SOAJS_NX_CONTROLLER_PORT": {
					"type": "computed",
					"value": "$SOAJS_NX_CONTROLLER_PORT"
				},
				"SOAJS_NX_SITE_DOMAIN": {
					"type": "computed",
					"value": "$SOAJS_NX_SITE_DOMAIN"
				}
			},
			"settings": {
				"accelerateDeployment": false
			},
			"cmd": {
				"deploy": {
					"command": [
						"bash"
					],
					"args": [
						"-c",
						"node index.js -T nginx -S deploy",
						"node index.js -T nginx -S install",
						"/opt/soajs/soajs.deployer/deployer/bin/nginx.sh"
					]
				}
			}
		}
	},
	"v": 1,
	"ts": new Date().getTime()
};
module.exports = doc;