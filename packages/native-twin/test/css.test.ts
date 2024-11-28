import { sheetEntriesToCss } from '@native-twin/css';
import {
  defineConfig,
  setup,
  tx,
  cx,
  matchThemeColor,
  matchThemeValue,
} from '../src/index.js';

setup(
  defineConfig({
    content: [],
    mode: 'web',
    rules: [
      matchThemeColor('bg-', 'backgroundColor'),
      // @ts-ignore
      matchThemeValue('p', 'spacing', 'padding', {
        canBeNegative: true,
        feature: 'edges',
        prefix: 'padding',
      }),
      // @ts-ignore
      matchThemeValue('shadow-', 'boxShadow', 'shadowRadius'),
    ],
    theme: {
      screens: {
        md: '640px',
        sm: '740px',
      },
      colors: {
        primary: 'blue',
      },
      spacing: {
        1: '1rem',
        2: '2rem',
      },
      boxShadow: {
        sm: {
          shadowOffset: { width: 0, height: 1 },
          shadowColor: 'rgb(0,0,0)',
          shadowRadius: 3,
          shadowOpacity: 0.3,
          elevation: 1,
        },
      },
    },
  }),
);

describe('@native-twin/core - Raw rules parser', () => {
  it('Sheet entries to CSS', () => {
    const entries = tx`bg-primary !px-1 first-letter:px-2 asd md:sm:px-2`;
    const css = sheetEntriesToCss(entries);
    // console.log('CSS: ', css);
    // console.log('ENTRIES: ', tw.sheet);
    expect(css).toStrictEqual(
      `.bg-primary{background-color:blue;}
.\\!px-1{padding-left:1rem !important;padding-right:1rem !important;}
.first-letter\\:px-2::first-letter{padding-left:2rem;padding-right:2rem;}
.asd{}
@media (min-width:740px){@media (min-width:640px){.md\\:sm\\:px-2{padding-left:2rem;padding-right:2rem;}}}`,
    );
  }); //?
});
