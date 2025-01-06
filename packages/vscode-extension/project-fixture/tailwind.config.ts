import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export default defineConfig({
  content: ['./App.tsx', './Component.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  root: {
    rem: 16,
  },
  mode: 'web',
  theme: {
    screens: {
      md: '640px',
      sm: '740px',
    },
    extend: {
      screens: {
        md: '640px',
        sm: '740px',
      },
      colors: {
        primary: 'blue',
      },
      fontFamily: {
        DEFAULT: 'Inter-Regular',
        inter: 'Inter-Regular',
        'inter-bold': 'Inter-Bold',
        'inter-medium': 'Inter-Medium',
        sans: 'Inter-Regular',
      },
    },
  },
  presets: [presetTailwind()],
});
