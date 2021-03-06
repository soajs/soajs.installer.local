"use strict";

module.exports = {
	"type": "service",
	"name": "controller",
	"description": "SOAJS multitenant gateway with automated microservices awareness and interconnect mesh",
	"metadata": {
		"tags": ["gateway", "awareness", "interconnect", "multitennant"],
		"attributes": {
			"multitennant": ["authentication", "authorization"],
			"registry": ["throttling", "custom", "database"]
		},
		"program": ["soajs"]
	},
	"configuration": {
		"port": 4000,
		"subType": "soajs",
		"group": "Gateway"
	},
	"versions": [
		{
			"version": "1",
			"maintenance": {
				"readiness": "/heartbeat",
				"port": {
					"type": "maintenance"
				},
				"commands": [
					{
						"label": "Reload Provision",
						"path": "/loadProvision",
						"icon": "fas fa-download"
					},
					{
						"label": "Reload Registry",
						"path": "/reloadRegistry",
						"icon": "fas fa-undo"
					},
					{
						"label": "Reload Awareness",
						"path": "/awarenessStat",
						"icon": "fas fa-wifi"
					}
				]
			},
			"documentation": {
				"readme": "# soajs.controller\nThe Controller is the main gateway to all of SOAJS services.\n\n##Installation\n\n```sh\n$ npm install soajs.controller\n$ node.\n```\n\n---\n\n###Self Awareness:\nThe controller's main functionality is to perform heartbeat checks on the remaining services.<br>\nThis approach allows the self awareness feature that SOAJS offers.\n\nIf a service is down or does not exist, the controller will return a message back to the sender without crashing.<br>\nWhen a new service is created or added to the cloud, the controller will detect its presence.<br>\nAll requests to this new service will then be forwarded.\n\n###Security:\nWhen a request is made to a SOAJS service, the controller checks if this service is running, and accessible.<br>\nBefore forwarding the request or checking if the service is up and running, the controller makes performs some clearance checks:\n\n1. Checks if the service needs a key and that the key is provided in the request and allows access to this service.\n2. Retrieves the ACL of the tenant of this key and checks if the tenant has permission to use the requested service.\n3. Performs a heartbeat check to make sure the service is alive.\n4. Checks the Authorization of the header if the service requires authorization to be accessed like oAuth.\n5. Forwards the request if all is ok.\n\n###Cors:\nSOAJS controller also provides support for CORS (Cross Origin Resource Sharing).\n\nEnabling CORS allows different domains to communicate with SOAJS via its gateway to post and pull resources without having to deal with \"cross-domain\" issues and by simply using the standard protocols: GET - POST - DELETE - PUT.\n\n---\n\nMore information on the Controller is available on the website section [Controller](https://soajsorg.atlassian.net/wiki/x/loAwb)\n\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n\n",
				"release": "# soajs release\n\nSOAJS follows the fish names as release names\n\nWe also push patches per release that are numbered like Kanuy 4, Kanuy 5, …\n\nEach release or patch might affect several repositories and each source code has its own semantic version and each microservice has its own version.\n\n### Complete Documentation\nMore information is available on SOAJS website under the section for [Release](https://soajsorg.atlassian.net/wiki/x/QYCmbw).\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n"
			}
		}
	],
	"settings": {
		"recipes": [
			"5df3ec10fa3912534948f000"
		]
	}
};