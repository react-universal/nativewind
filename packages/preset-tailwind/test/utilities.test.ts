import { createVirtualSheet } from '@native-twin/css';
import { createTailwind } from '@native-twin/core';
import { presetTailwind } from '../src/index.js';

const tailwind = createTailwind(
  {
    content: [],
    mode: 'web',
    presets: [presetTailwind()],
    ignorelist: [],
    theme: {
      extend: {
        colors: {
          primary: '#0558f9',
        },
      },
    },
  },
  createVirtualSheet(),
);

describe('@native-twin/preset-tailwind - Spacing Utilities', () => {
  it('paddings', () => {
    expect(tailwind('p-2')).toStrictEqual([
      {
        animations: [],
        className: 'p-2',
        declarations: [
          {
            prop: 'padding',
            value: '0.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('px-2')).toStrictEqual([
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
    ]);
    expect(tailwind('absolute')).toStrictEqual([
      {
        animations: [],
        className: 'absolute',
        declarations: [{ prop: 'position', value: 'absolute' }],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('py-2')).toStrictEqual([
      {
        animations: [],
        className: 'py-2',
        declarations: [
          { prop: 'paddingTop', value: '0.5rem' },
          { prop: 'paddingBottom', value: '0.5rem' },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
  it('margins', () => {
    expect(tailwind('m-2')).toStrictEqual([
      {
        animations: [],
        className: 'm-2',
        declarations: [
          {
            prop: 'margin',
            value: '0.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('-m-2')).toStrictEqual([
      {
        animations: [],
        className: '-m-2',
        declarations: [
          {
            prop: 'margin',
            value: '-0.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('mx-2')).toStrictEqual([
      {
        animations: [],
        className: 'mx-2',
        declarations: [
          { prop: 'marginLeft', value: '0.5rem' },
          { prop: 'marginRight', value: '0.5rem' },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('my-2')).toStrictEqual([
      {
        animations: [],
        className: 'my-2',
        declarations: [
          {
            prop: 'marginTop',
            value: '0.5rem',
          },
          {
            prop: 'marginBottom',
            value: '0.5rem',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
  it('arbitrary', () => {
    expect(tailwind('m-[20px]')).toStrictEqual([
      {
        animations: [],
        className: 'm-[20px]',
        declarations: [
          {
            prop: 'margin',
            value: '20px',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
    expect(tailwind('-mx-[20px]')).toStrictEqual([
      {
        animations: [],
        className: '-mx-[20px]',
        declarations: [
          {
            prop: 'marginLeft',
            value: '-20px',
          },
          {
            prop: 'marginRight',
            value: '-20px',
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

describe('@native-twin/core - Color Utilities', () => {
  it('Basic color', () => {
    expect(tailwind('bg-black')).toStrictEqual([
      {
        animations: [],
        className: 'bg-black',
        declarations: [
          {
            prop: 'backgroundColor',
            value: 'rgba(0,0,0,1)',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
  it('Custom color', () => {
    expect(tailwind('bg-primary')).toStrictEqual([
      {
        animations: [],
        className: 'bg-primary',
        declarations: [
          {
            prop: 'backgroundColor',
            value: 'rgba(5,88,249,1)',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
  it('Opacity', () => {
    expect(tailwind('opacity-10')).toStrictEqual([
      {
        animations: [],
        className: 'opacity-10',
        declarations: [
          {
            prop: 'opacity',
            value: '0.1',
          },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
  it('Color modifier', () => {
    expect(tailwind('bg-blue-200/[0.5]')).toStrictEqual([
      {
        animations: [],
        className: 'bg-blue-200/[0.5]',
        declarations: [
          {
            prop: 'backgroundColor',
            value: 'rgba(191,219,254,0.5)',
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

describe('@native-twin/preset-tailwind - Position Utilities', () => {
  it('top|right|bottom|left', () => {
    expect(tailwind('top-2')).toStrictEqual([
      {
        animations: [],
        className: 'top-2',
        declarations: [
          {
            prop: 'top',
            value: '0.5rem',
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

describe('@native-twin/preset-tailwind - Border Utilities', () => {
  it('t|r|b|l', () => {
    expect(tailwind('border-x-1')).toStrictEqual([
      {
        animations: [],
        className: 'border-x-1',
        declarations: [
          { prop: 'borderLeftWidth', value: '1px' },
          { prop: 'borderRightWidth', value: '1px' },
        ],
        important: false,
        precedence: 805306368,
        selectors: [],
        preflight: false,
      },
    ]);
  });
});
