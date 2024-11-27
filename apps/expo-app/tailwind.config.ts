// import { Keyframe } from 'react-native-reanimated';
import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export const twinConfig = defineConfig({
  content: ['index.js', './App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  root: {
    rem: 50,
  },
  theme: {
    extend: {
      screens: {
        sm: {
          min: '200px',
          max: '500px',
        },
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
  // animations: [
  //   [
  //     'slideIn',
  //     new Keyframe({
  //       0: { transform: [{ rotateX: '10deg' }] },
  //       50: { transform: [{ rotateX: '45deg' }] },
  //       100: { transform: [{ rotateX: '180deg' }] },
  //     }),
  //   ],
  // ],
});

export default twinConfig;
