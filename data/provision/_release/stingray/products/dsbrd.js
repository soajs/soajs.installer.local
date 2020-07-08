'use strict';

let doc = {
	"_id": "5512867be603d7e01ab1688d",
	"locked": true,
	"code": "DSBRD",
	"console": true,
	"name": "Console UI Product",
	"description": "This is the main Console UI Product.",
	"scope": {
		"acl": {
			"dashboard": {
				"console": {
					"1": {
						"access": true
					}
				},
				"repositories": {
					"1": {
						"access": true
					}
				},
				"marketplace": {
					"1": {
						"access": true
					}
				},
				"infra": {
					"1": {
						"access": true
					}
				},
				"dashboard": {
					"1": {
						"access": true
					}
				},
				"multitenant": {
					"1": {
						"access": true
					}
				},
				"urac": {
					"3": {
						"access": true,
						"apisPermission": "restricted",
						"get": [
							{
								"group": "Administration",
								"apis": {
									"/admin/all": {
										"access": true
									}
								}
							}, {
								"group": "User administration",
								"apis": {
									"/admin/users": {
										"access": true
									}
								}
							},
							{
								"group": "Group administration",
								"apis": {
									"/admin/groups": {
										"access": true
									}
								}
							}, {
								"group": "My account",
								"apis": {
									"/user": {
										"access": true
									}
								}
							}, {
								"group": "My account guest",
								"apis": {
									"/password/forgot": {
										"access": false
									},
									"/validate/changeEmail": {
										"access": true
									},
								}
							}],
						"post": [
							{
								"group": "User administration",
								"apis": {
									"/admin/user": {
										"access": true
									}
								}
							},
							{
								"group": "Group administration",
								"apis": {
									"/admin/group": {
										"access": true
									}
								}
							}],
						"put": [
							{
								"group": "User administration",
								"apis": {
									"/admin/user/status": {
										"access": true
									},
									"/admin/user": {
										"access": true
									},
								}
							},
							{
								"group": "Group administration",
								"apis": {
									"/admin/group": {
										"access": true
									},
									"/admin/groups/environments": {
										"access": true
									}
								}
							},
							{
								"group": "My account",
								"apis": {
									"/account/email": {
										"access": true
									},
									"/account/password": {
										"access": true
									},
									"/account": {
										"access": true
									}
								}
							},
							{
								"group": "My account guest",
								"apis": {
									"/password/reset": {
										"access": false
									}
								}
							}
						],
						"delete": [{
							"group": "Group administration",
							"apis": {
								"/admin/group": {
									"access": true
								}
							}
						}]
					}
				},
				"oauth": {
					"1": {
						"access": true,
						"apisPermission": "restricted",
						"delete": [{
							"group": "Tokenization",
							"apis": {
								"/refreshToken/:token": {
									"access": true
								},
								"/accessToken/:token": {
									"access": true
								}
							}
						}, {
							"group": "User Tokenization",
							"apis": {
								"/tokens/user/:userId": {
									"access": true
								}
							}
						}, {
							"group": "Cient Tokenization",
							"apis": {
								"/tokens/tenant/:clientId": {
									"access": true
								}
							}
						}],
						"post": [{
							"group": "Tokenization",
							"apis": {
								"/pin": {
									"access": true
								}
							}
						}, {
							"group": "Guest",
							"apis": {
								"/token": {
									"access": false
								}
							}
						}],
						"get": [{
							"group": "Guest",
							"apis": {
								"/authorization": {
									"access": false
								},
								"/available/login": {
									"access": false
								}
							}
						}]
					}
				}
			}
		},
	},
	"packages": [
		{
			"code": "DSBRD_GUEST",
			"name": "Guest",
			"locked": true,
			"description": "This package is used to provide anyone access to login and forgot password. Once logged in the package linked to the user tenant will take over thus providing the right access to the logged in user.",
			"acl": {
				"dashboard": {
					"oauth": [{
						"version": "1",
						"get": ["Guest"],
						"post": ["Guest", "Tokenization"],
						"delete": ["Tokenization"]
					}],
					"urac": [{
						"version": "3",
						"put": ["My account guest"],
						"get": ["My account guest"]
					}]
				}
			},
			"_TTL": 604800000
		},
		{
			"code": "DSBRD_OWNER",
			"name": "Owner",
			"description": "This package is used to provide owner level access. This means the user who has this package will have access to everything.",
			"locked": true,
			"acl": {
				"dashboard": {
					"oauth": [{
						"version": "1",
						"get": ["Guest"],
						"post": ["Guest", "Tokenization"],
						"delete": ["Tokenization", "User Tokenization", "Cient Tokenization"]
					}],
					"urac": [{
						"version": "3",
						"get": ["My account guest", "Administration", "My account", "User administration", "Group administration"],
						"post": ["User administration", "Group administration"],
						"put": ["My account guest", "My account", "User administration", "Group administration"],
						"delete": ["Group administration"]
					}],
					"dashboard": [{
						"version": "1"
					}],
					"console": [{
						"version": "1"
					}],
					"repositories": [{
						"version": "1"
					}],
					"marketplace": [{
						"version": "1"
					}],
					"infra": [{
						"version": "1"
					}],
					"multitenant": [{
						"version": "1"
					}]
				}
			},
			"_TTL": 604800000
		},
		{
			"code": "DSBRD_DEVEL",
			"name": "Developer",
			"locked": true,
			"description": "This package is ideal for a developer. You are not giving much access but yet it is enough to sail and fast.",
			"acl": {
				"dashboard": {
					"oauth": [{
						"version": "1",
						"get": ["Guest"],
						"post": ["Guest", "Tokenization"],
						"delete": ["Tokenization", "User Tokenization", "Cient Tokenization"]
					}],
					"urac": [{
						"version": "3",
						"get": ["My account", "My account guest"],
						"put": ["My account", "My account guest"]
					}],
					"dashboard": [{
						"version": "1"
					}],
					"console": [{
						"version": "1"
					}],
					"repositories": [{
						"version": "1"
					}],
					"marketplace": [{
						"version": "1"
					}],
					"infra": [{
						"version": "1"
					}],
					"multitenant": [{
						"version": "1"
					}]
				}
			},
			"_TTL": 21600000
		},
		{
			"code": "DSBRD_INTG",
			"name": "Integration Package",
			"locked": true,
			"description": "Integration Package is ideal to help you change SOAJS Configuration Programmatically via API.",
			"acl": {
				"dashboard": {
					"oauth": [
						{
							"version": "1",
							"post": [
								"Guest",
								"Tokenization"
							],
							"get": [
								"Guest"
							],
							"delete": [
								"Tokenization",
								"Cient Tokenization",
								"User Tokenization"
							]
						}
					],
					"multitenant": [
						{
							"version": "1"
						}
					]
				}
			},
			_TTL: 21600000
		}
	]
};

module.exports = doc;