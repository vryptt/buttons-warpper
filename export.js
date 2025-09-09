/**
 * Central export surface for this package.
 * Re-exports helper functions from local modules and exposes package metadata.
 */

const buttons = require('./helpers/buttons');
const pkg = require('./package.json');

const getPackageInfo = () => ({
	name: pkg.name,
	version: pkg.version,
	description: pkg.description,
	author: pkg.author,
	main: pkg.main,
});

module.exports = {
	// re-export all named helpers from buttons.js (sendInteractiveButtonsBasic, sendButtons, ...)
	...buttons,

	// package metadata convenience
	pkg,
	getPackageInfo,
};
