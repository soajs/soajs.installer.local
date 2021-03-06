"use strict";

module.exports = {
	"type": "service",
	"name": "console",
	"metadata": {
		"tags": ["console", "environment", "registry", "ledger", "notification"],
		"attributes": {
			"environment": ["manual", "container"],
			"registry": ["throttling", "custom", "database", "resource configuration"]
		},
		"program": ["soajs"]
	},
	"configuration": {
		"subType": "soajs",
		"group": "Console",
		"port": 4009,
		"requestTimeout": 30,
		"requestTimeoutRenewal": 5
	},
	"versions": [
		{
			"version": "1",
			"extKeyRequired": true,
			"urac": true,
			"urac_Profile": false,
			"urac_ACL": false,
			"urac_Config": false,
			"urac_GroupConfig": false,
			"tenant_Profile": false,
			"provision_ACL": false,
			"oauth": true,
			"interConnect": [
				{
					"name": "infra",
					"version": "1"
				}
			],
			"maintenance": {
				"readiness": "/heartbeat",
				"port": {
					"type": "maintenance"
				},
				"commands": [
					{
						"label": "Reload Registry",
						"path": "/reloadRegistry",
						"icon": "fas fa-undo"
					},
					{
						"label": "Resource Info",
						"path": "/resourceInfo",
						"icon": "fas fa-info"
					}
				]
			},
			"documentation": {
				"readme": "# soajs.console\n\nSOAJS console is a service that manages everything related to soajs registry, api builder, dashboard, and api builder.\n\n### Complete Documentation\nMore information is available on SOAJS website under the section for [Console](https://soajsorg.atlassian.net/wiki/x/QYCmbw).\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n",
				"release": "# soajs release\n\nSOAJS follows the fish names as release names\n\nWe also push patches per release that are numbered like Kanuy 4, Kanuy 5, …\n\nEach release or patch might affect several repositories and each source code has its own semantic version and each microservice has its own version.\n\n### Complete Documentation\nMore information is available on SOAJS website under the section for [Release](https://soajsorg.atlassian.net/wiki/x/QYCmbw).\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n"
			},
			"apis": [
				{
					"l": "This API returns all the ledger entries with the ability to filter entries by env, type and section",
					"v": "/ledger",
					"m": "get",
					"group": "Ledger"
				},
				{
					"l": "This API returns the environment(s).",
					"v": "/environment",
					"m": "get",
					"group": "Environment"
				},
				{
					"l": "This API returns the environment settings.",
					"v": "/environment/settings",
					"m": "get",
					"group": "Environment"
				},
				{
					"l": "This API returns the release information.",
					"v": "/release",
					"m": "get",
					"group": "Settings"
				},
				{
					"l": "This API returns the ui setting.",
					"v": "/ui/setting",
					"m": "get",
					"group": "Settings"
				},
				{
					"l": "This API gets a registry",
					"v": "/registry",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "This API gets a registry key",
					"v": "/registry/key",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "This API gets the throttling configuration",
					"v": "/registry/throttling",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "This API gets all custom registry",
					"v": "/registry/custom",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "This API gets all resource configuration",
					"v": "/registry/resource",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "This API gets a registry deployer information",
					"v": "/registry/deployer",
					"m": "get",
					"group": "Registry"
				},
				{
					"l": "List tenant oauth users",
					"v": "/tenant/oauth/users",
					"m": "get",
					"group": "Oauth"
				},
				{
					"l": "This API deletes an environment",
					"v": "/environment",
					"m": "delete",
					"group": "Environment"
				},
				{
					"l": "This API deletes the environment acl",
					"v": "/environment/acl",
					"m": "delete",
					"group": "Environment"
				},
				{
					"l": "This API deletes a custom DB",
					"v": "/registry/db/custom",
					"m": "delete",
					"group": "Registry"
				},
				{
					"l": "This API deletes the session DB",
					"v": "/registry/db/session",
					"m": "delete",
					"group": "Registry"
				},
				{
					"l": "This API deletes a custom registry",
					"v": "/registry/custom",
					"m": "delete",
					"group": "Registry"
				},
				{
					"l": "This API deletes the custom registry acl",
					"v": "/registry/custom/acl",
					"m": "delete",
					"group": "Account"
				},
				{
					"l": "This API deletes a resource configuration",
					"v": "/registry/resource",
					"m": "delete",
					"group": "Registry"
				},
				{
					"l": "This API deletes the resource configuration acl",
					"v": "/registry/resource/acl",
					"m": "delete",
					"group": "Account"
				},
				{
					"l": "Delete tenant oauth user",
					"v": "/tenant/oauth/user",
					"m": "delete",
					"group": "Oauth"
				},
				{
					"l": "This API adds an entry to the ledger of a specific type",
					"v": "/ledger",
					"m": "post",
					"group": "Ledger"
				},
				{
					"l": "This API adds an environment",
					"v": "/environment",
					"m": "post",
					"group": "Environment"
				},
				{
					"l": "This API adds a custom DB",
					"v": "/registry/db/custom",
					"m": "post",
					"group": "Registry"
				},
				{
					"l": "This API adds a custom registry",
					"v": "/registry/custom",
					"m": "post",
					"group": "Registry"
				},
				{
					"l": "This API adds a resource",
					"v": "/registry/resource",
					"m": "post",
					"group": "Registry"
				},
				{
					"l": "Add tenant oauth user",
					"v": "/tenant/oauth/user",
					"m": "post",
					"group": "Oauth"
				},
				{
					"l": "This API updates the environment acl",
					"v": "/environment/acl",
					"m": "put",
					"group": "Environment"
				},
				{
					"l": "This API updates the environment information",
					"v": "/environment",
					"m": "put",
					"group": "Environment"
				},
				{
					"l": "This API updates the registry db prefix",
					"v": "/registry/db/prefix",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates the registry db session",
					"v": "/registry/db/session",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates a registry",
					"v": "/registry",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates throttling",
					"v": "/registry/throttling",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates a custom registry",
					"v": "/registry/custom",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates the custom registry acl",
					"v": "/registry/custom/acl",
					"m": "put",
					"group": "Account"
				},
				{
					"l": "This API updates a resource configuration",
					"v": "/registry/resource",
					"m": "put",
					"group": "Registry"
				},
				{
					"l": "This API updates the resource configuration acl",
					"v": "/registry/resource/acl",
					"m": "put",
					"group": "Account"
				},
				{
					"l": "Update tenant oauth user",
					"v": "/tenant/oauth/user",
					"m": "put",
					"group": "Oauth"
				}
			]
		}
	],
	"description": "This service takes care of updates and upgrades as well as everything related to registry",
	"settings": {
		"recipes": [
			"5edf6bf536c77052b0a5e1f1"
		]
	}
};