'use strict';

module.exports = {
	"name": "core_provision",
	"cluster": "dash_cluster",
	"prefix": "",
	"servers": [
		{
			"host": "127.0.0.1",
			"port": 32017
		}
	],
	"credentials": null,
	"streaming": {
		"batchSize": 1000
	},
	"URLParam": {
		"maxPoolSize": 2,
		"bufferMaxEntries": 0,
		"useUnifiedTopology": true
	}
};
