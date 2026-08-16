const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// ../shared holds the logic this app and dose-tracker-plain both use.
// Metro only watches the project directory by default, so without this an
// import from outside it resolves at build time and then fails to
// hot-reload — or fails outright.
config.watchFolders = [path.resolve(repoRoot, 'shared')];

// Watching a folder outside the project also means Metro will look for
// modules relative to it, so pin resolution to this project's node_modules
// and keep it from wandering up the tree.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
