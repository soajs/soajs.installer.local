"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const soajs = require('soajs');

module.exports = {
	"getLogger": () => {
		return soajs.core.getLogger("SOAJS Installer", {"formatter": {"levelInString": true, "outputMode": 'short'}, "level": "debug"});
	}
};