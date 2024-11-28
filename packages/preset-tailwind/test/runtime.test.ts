import { defineConfig, setup, tx } from '@native-twin/core';
import { presetTailwind } from '../src/index.js';

setup(
  defineConfig({
    content: [],
    mode: 'web',
    presets: [presetTailwind()],
    theme: {
      extend: {
        fontFamily: {
          inter: 'Inter',
        },
      },
    },
  }),
);

describe('@native-twin/preset-tailwind - TW call', () => {
  it('Insert rules', () => {
    const result = tx`
    px-2 m-10 
    text(2xl indigo-200)
  `;
    expect(result).toStrictEqual([
      {
        animations: [],
        className: 'px-2',
        declarations: [
          { prop: 'paddingLeft', value: '0.5rem' },
          { prop: 'paddingRight', value: '0.5rem' },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
      {
        animations: [],
        className: 'm-10',
        declarations: [
          {
            prop: 'margin',
            value: '2.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
      {
        animations: [],
        className: 'text-2xl',
        declarations: [
          {
            prop: 'fontSize',
            value: '1.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
      {
        animations: [],
        className: 'text-indigo-200',
        declarations: [
          {
            prop: 'color',
            value: 'rgba(199,210,254,1)',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
});
