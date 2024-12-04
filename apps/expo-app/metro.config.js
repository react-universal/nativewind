const { getDefaultConfig } = require('expo/metro-config');
const { withNativeTwin } = require('@native-twin/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */

module.exports = withNativeTwin(config, {
  projectRoot,
  twinConfigPath: path.join(__dirname, 'tailwind.config.ts'),
  inputCSS: path.join(projectRoot, 'global.css'),
  logLevel: 'Debug',
});
