const path = require('path');

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+.[jt]sx?$': [
      'ts-jest',
      {
        // useESM: true,
        babelConfig: path.join(__dirname, 'babel.config.js'),
        tsconfig: path.join(__dirname, 'tsconfig.json'),
      },
    ],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
  // extensionsToTreatAsEsm: ['.ts'],
};
