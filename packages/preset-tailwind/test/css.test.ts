import { sheetEntriesToCss } from '@native-twin/css';
import { defineConfig, setup, tx } from '@native-twin/core';
import { presetTailwind } from '../src/index.js';

setup(defineConfig({ content: [], presets: [presetTailwind()], mode: 'web' }));

describe('@native-twin/preset-tailwind - Raw rules parser', () => {
  it('Sheet entries to CSS', () => {
    const entries = tx`bg-blue-200 text-center`;
    const css = sheetEntriesToCss(entries);
    expect(css).toStrictEqual(
      '.bg-blue-200{background-color:rgba(191,219,254,1);}\n' +
        '.text-center{text-align:center;}',
    );
  });
  it('Sheet entries to CSS', () => {
    const entries = tx`bg-blue-200 text-center md:text-left`;
    const css = sheetEntriesToCss(entries);
    expect(css).toStrictEqual(
      '.bg-blue-200{background-color:rgba(191,219,254,1);}\n' +
        '.text-center{text-align:center;}\n' +
        '@media (min-width:768px){.md\\:text-left{text-align:left;}}',
    );
  });
});
