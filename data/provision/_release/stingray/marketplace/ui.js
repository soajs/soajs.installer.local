"use strict";

module.exports = {
	"type": "static",
	"name": "ui",
	"metadata": {
		"tags": ["UI", "console", "dashboard"],
		"attributes": {
			"SPOG": ["reporting", "analytics", "monitoring", "federation"]
		},
		"program": ["soajs"]
	},
	"configuration": {
		"subType": "soajs",
		"group": "Console"
	},
	"versions": [
		{
			"version": "1",
			"documentation": {
				"readme": "# soajs.dashboard.ui\n\nThe SOAJS Dashboard UI runs in the dashboard environment and offers an interface built using Angular JS that communicates with the microservices deployed in the dashboard environment: [URAC](https://soajsorg.atlassian.net/wiki/spaces/URAC) - [oAuth](https://soajsorg.atlassian.net/wiki/spaces/OAUT/overview) - [DASHBOARD](https://soajsorg.atlassian.net/wiki/spaces/DSBRD/overview)\n\n---\n## Installation\nThe dashboard UI is a simple angular js application consisting of HTML, CSS & Javascript and is installed once you deploy the soajs pipeline as shown in the [SOAJS installer](https://soajsorg.atlassian.net/wiki/spaces/IN).\nOnce the dashboard environment is deployed, you can access this interface via your browser by opening the domain you have entered for your project.\n---\nMore information is available in the SOAJS Documentation Space [Reference Link](https://soajsorg.atlassian.net/wiki/spaces/DSBRD/overview)\n\n### The needed environments variable examples\nCheck out soajs.deployer for more information\n\nexport SOAJS_GATEWAY_CONFIG='{\"domain\":\"api.soajs.org\",\"port\":\"4000\",\"ip\":\"127.0.0.1\",\"domainPrefix\":\"api\"}'\n\nexport SOAJS_SITES_CONFIG='[{\"conf\":{\"domains\":[\"console.soajs.org\", \"soajs.org\"],\"folder\":\"/console/\"}}]'\n\nexport SOAJS_ENV='DASHBOARD'\n\nexport SOAJS_EXTKEY='888888888'\n\nexport SOAJS_SSL_CONFIG='{\"email\":\"me@ddd.com\"}'\n\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n",
				"release": "# soajs release\n\nSOAJS follows the fish names as release names\n\nWe also push patches per release that are numbered like Kanuy 4, Kanuy 5, …\n\nEach release or patch might affect several repositories and each source code has its own semantic version and each microservice has its own version.\n\n### Complete Documentation\nMore information is available on SOAJS website under the section for [Release](https://soajsorg.atlassian.net/wiki/x/QYCmbw).\n\n### License\n*Copyright SOAJS All Rights Reserved.*\n\nUse of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.\n"
			}
		}
	],
	"description": "This is the SOAJS console UI",
	"settings": {
		"recipes": [
			"5df3ec10fa3912534948f00d", "5df3ec10fa3912534948effe"
		]
	}
};