const { getDefaultConfig } = require('expo/metro-config');
const { withNativeTwin } = require('@native-twin/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */

module.exports = withNativeTwin(config, {
  configPath: path.join(__dirname, 'tailwind.config.ts'),
  inputCSS: 'globals.css',
});
