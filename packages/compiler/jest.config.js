/** @type {import('jest').Config} */
module.exports = {
  roots: ['test'],
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.[t|j]sx?$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [1343],
        },
        astTransformers: {
          before: [
            {
              path: require.resolve('ts-jest-mock-import-meta'), // or, alternatively, 'ts-jest-mock-import-meta' directly, without node_modules.
              options: { metaObjectReplacement: { url: new URL('file://asd.js').toString() } },
            },
          ],
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  watchPathIgnorePatterns: ['test/fixtures/*', 'test/node_modules/*', 'build/*/*.js'],
};
