import { defineConfig } from '@native-twin/core';

export default defineConfig({
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
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
});
