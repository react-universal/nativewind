export const buildExternals = [
  // VSCODE
  'vscode',
  'monaco-editor',
  'vscode-languageserver-types',
  'vscode-languageserver-textdocument',
  'vscode-languageserver',
  'vscode-languageclient',

  // EXPO
  /^expo\/*/,
  /^babel-preset-expo\/*/,
  /^babel-preset-expo(.*)/,
  'babel-plugin-react-compiler',
  /^@expo\/*/,

  // REACT_NATIVE
  /^metro\/*/,
  'metro',
  'hermes-parser',
  'react-native',
  /^react-native\/*/,
  'react-native-web',
  /^react-native-web\/*/,
  '@babel/*',
  /^@babel\/*/,
  'react-native-reanimated',
  'lightningcss',
  '@testing-library/react-native',
  /^@testing-library\/*/,
  'metro-transform-worker',

  // REACT
  'react',
  'react-is',
  /^react\/*/,
  'next',
  /^next\/*/,
  '@jest/globals',
  'jest',
  /^jest\/*/,
  'expect',

  // NATIVE_TWIN
  '@native-twin/*',
  /^@native-twin\/*/,
  'sucrase',
  '@effect/*',
  /^@effect\/*/,
  /^effect\/*/,
  'effect',
  'jiti',
  'jscodeshift',
];

export const bundlerExternals = [
  // VSCODE
  'vscode',
  'monaco-editor',
  'vscode-languageserver-types',
  'vscode-languageserver-textdocument',
  'vscode-languageserver',
  'vscode-languageclient',

  // EXPO
  /^expo\/*/,
  /^babel-preset-expo\/*/,
  /^babel-preset-expo(.*)/,
  'babel-plugin-react-compiler',
  /^@expo\/*/,

  // REACT_NATIVE
  /^metro\/*/,
  'metro',
  'hermes-parser',
  'react-native',
  /^react-native\/*/,
  'react-native-web',
  /^react-native-web\/*/,
  '@babel/*',
  /^@babel\/*/,
  'react-native-reanimated',
  'lightningcss',
  '@testing-library/react-native',
  /^@testing-library\/*/,
  'metro-transform-worker',

  // BABEL
  '@babel/*',
  '@babel/core',
  '@babel/types',
  '@babel/traverse',
  '@babel/generate',
  '@babel/template',
  'to-regex-range',
  'braces',
  'micromatch',

  // REACT
  'react',
  'react-is',
  /^react\/*/,
  'next',
  /^next\/*/,
  '@jest/globals',
  'jest',
  /^jest\/*/,
  'expect',

  // NATIVE_TWIN
  '@native-twin/*',
  /^@native-twin\/*/,
  'sucrase',
  // '@effect/*',
  // /^@effect\/*/,
  // /^effect\/*/,
  // 'effect',
  'jiti',
  'jscodeshift',
];