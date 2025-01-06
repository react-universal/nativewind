import * as babel from '@babel/core';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export const runPluginForFixture = (inputFile: string, outputFile: string) => {
  const code = readFileSync(inputFile, 'utf-8');

  const output = babel.transform(code, {
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: '@native-twin/jsx',
        },
      ],
      [
        require('../babel'),
        {
          twinConfigPath: './tailwind.config.ts',
        },
      ],
    ],
    filename: inputFile,
    ast: true,
    cwd: path.join(__dirname),
    envName: 'development',
    minified: false,
    generatorOpts: {
      minified: false,
    },
    compact: false,
  });

  writeFileSync(outputFile, output?.code ?? 'ERROR!');
  return readFileSync(outputFile, 'utf-8');
};
