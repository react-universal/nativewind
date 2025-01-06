/** @type {import("jest").Config} */
module.exports = {
  preset: 'jest-expo/ios',
  watchPathIgnorePatterns: ['test/fixtures/*', 'test/node_modules/*', 'build/*/*.js'],
  passWithNoTests: true,
};
