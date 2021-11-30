'use strict';
let doc = {
	"_id": "5ca223b3b77f8d203a646ca8",
	"code": "DEMO",
	"apiPrefix": "",
	"dbs": {
		"config": {
			"prefix": null
		},
		"databases": {
			"urac": {
				"prefix": null,
				"cluster": "soajs_cluster",
				"tenantSpecific": true
			},
			"oauth": {
				"cluster": "soajs_cluster",
				"tenantSpecific": false
			}
		}
	},
	"deployer": {
		"manual": {
			"nodes": "127.0.0.1"
		},
		"type": "manual",
		"selected": "manual"
	},
	"description": "Manual DEMO environment for learning",
	"domain": "127.0.0.1",
	"port": 10000,
	"protocol": "http",
	"sensitive": false,
	"services": {
		"controller": {
			"authorization": false,
			"requestTimeout": 30,
			"requestTimeoutRenewal": 5
		},
		"config": {
			"awareness": {
				"cacheTTL": 3600000,
				"healthCheckInterval": 5000,
				"autoRelaodRegistry": 3600000,
				"maxLogCount": 5,
				"autoRegisterService": true
			},
			"logger": {
				"src": false,
				"level": "debug",
				"formatter": {
					"levelInString": false,
					"outputMode": "short"
				}
			},
			"cors": {
				"credentials": "true",
				"enabled": true,
				"headers": "__env,key,soajsauth,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,access_token",
				"maxage": 1728000,
				"methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
				"origin": "*"
			},
			"oauth": {
				"grants": ["password", "refresh_token"],
				"debug": false,
				"accessTokenLifetime": 7200,
				"refreshTokenLifetime": 1209600,
				"getUserFromToken": false
			},
			"ports": {
				"controller": 10000,
				"maintenanceInc": 1000,
				"randomInc": 100
			},
			"cookie": {
				"secret": "AyYKTxKd1"
			},
			"session": {
				"name": "AA9dkJ-JT2",
				"secret": "pWHWak7zKL",
				"cookie": {
					"path": "/",
					"httpOnly": true,
					"secure": false,
					"maxAge": null
				},
				"resave": false,
				"saveUninitialized": false,
				"rolling": false,
				"unset": "keep"
			},
			"key": {
				"algorithm": "aes256",
				"password": "vinny is going to mexico"
			}
		}
	},
	"sitePrefix": ""
};

module.exports = doc;
