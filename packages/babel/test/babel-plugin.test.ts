import { pluginTester } from 'babel-plugin-tester';
import path from 'path';
import plugin from '../src';

describe('TESTS', () => {
  pluginTester({
    plugin,
    pluginOptions: {
      twinConfigPath: path.join(__dirname, './tailwind.config.ts'),
      cssInput: 'globals.css',
    },
    title: 'Native Twin babel plugin',
    babelOptions: {
      plugins: ['@babel/plugin-syntax-jsx'],
    },
    tests: {
      'createElement by namespace require': {
        // skip: true,
        only: true,
        codeFixture: path.join('./fixtures/namespace-require/code.js'),
        outputFixture: path.join('./fixtures/namespace-require/output.js'),
        babelOptions: {
          filename: path.join('./fixtures/namespace-require/someFile.jsx'),
        },
      },
      'createElement with interopRequire': {
        // skip: true,
        codeFixture: path.join('./fixtures/interop-require/code.js'),
        outputFixture: path.join('./fixtures/interop-require/output.js'),
        babelOptions: { filename: path.join('./fixtures/interop-require/someFile.jsx') },
      },
      'createElement identifier by default import': {
        // skip: true,
        // only: true,
        codeFixture: path.join('./fixtures/default-import/code.js'),
        outputFixture: path.join('./fixtures/default-import/output.js'),
        babelOptions: { filename: path.join('./fixtures/default-import/someFile.jsx') },
      },

      'createElement identifier by import': {
        // skip: true,
        // only: true,
        codeFixture: path.join('./fixtures/named-import/code.js'),
        outputFixture: path.join('./fixtures/named-import/output.js'),
        babelOptions: { filename: path.join('./fixtures/named-import/someFile.jsx') },
      },

      'createElement identifier by require': {
        // skip: true,
        // only: true,
        codeFixture: path.join('./fixtures/named-require/code.js'),
        outputFixture: path.join('./fixtures/named-require/output.js'),
        babelOptions: { filename: path.join('./fixtures/named-require/someFile.jsx') },
      },

      'createElement by namespace import': {
        // skip: true,
        codeFixture: path.join('./fixtures/namespace-require/code.js'),
        outputFixture: path.join('./fixtures/namespace-require/output.js'),
        babelOptions: {
          filename: path.join('./fixtures/namespace-require/someFile.jsx'),
        },
      },

      'createElement by namespace require (lowercase)': {
        // skip: true,
        codeFixture: path.join('./fixtures/namespace-require-lowercase/code.js'),
        outputFixture: path.join('./fixtures/namespace-require-lowercase/output.js'),
        babelOptions: {
          filename: path.join('./fixtures/namespace-require-lowercase/someFile.jsx'),
        },
      },

      'createELement from 3rd party': {
        // skip: true,
        codeFixture: path.join('./fixtures/create-third-party/code.js'),
        outputFixture: path.join('./fixtures/create-third-party/output.js'),
        babelOptions: {
          filename: path.join('./fixtures/create-third-party/someFile.jsx'),
        },
      },

      'compiled babel expo': {
        // skip: true,
        codeFixture: path.join('./fixtures/compiled/code.js'),
        outputFixture: path.join('./fixtures/compiled/out.js'),
        babelOptions: { filename: path.join('./fixtures/compiled/someFile.jsx') },
      },

      'createElement from denied modules': {
        // skip: true,
        codeFixture: path.join('./fixtures/denied-modules/code.js'),
        outputFixture: path.join('./fixtures/denied-modules/output.js'),
        babelOptions: {
          filename: '/node_modules/@native-twin/jsx/someFile.js',
        },
      },
    },
  });
});
