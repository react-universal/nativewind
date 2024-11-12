import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export default defineConfig({
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  root: {
    rem: 16,
  },
  mode: 'web',
  presets: [presetTailwind()],
});
