/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['test'],
  testMatch: ['**/test/**/*.test.ts'],
  watchPathIgnorePatterns: ['test/fixtures/*', 'test/node_modules/*', 'build/*/*.js'],
};
