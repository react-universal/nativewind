import { defineConfig, install, tw, extract } from '@native-twin/core';
import { presetTailwind } from '../src/index.js';

install(
  defineConfig({
    content: [],
    mode: 'web',
    presets: [presetTailwind({ disablePreflight: true })],
  }),
);

const html1 = `<html><head></head><body class="min-h-screen min-w-full"><div class="bg-blue-200" /></body>`;
// const html2 = `<html><head></head><body class="min-h-screen min-w-full"><div class="bg-red-200 hover:bg-blue-200" /></body>`;

describe('@native-twin/preset-tailwind - TW call', () => {
  it('Insert rules', () => {
    const result = extract(html1, tw);
    expect(result.css).toStrictEqual(
      `.bg-blue-200{background-color:rgba(191,219,254,1);}
.min-h-screen{min-height:100vh;}
.min-w-full{min-width:100%;}`,
    );
  });
});
