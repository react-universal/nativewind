import { setup } from '@native-twin/core';
import { defineConfig } from '@native-twin/core';
import type { CompleteStyle } from '@native-twin/css';
import { presetTailwind } from '@native-twin/preset-tailwind';
import { render as tlRender } from '@testing-library/react-native';
import { type ComponentProps, type ComponentType, forwardRef } from 'react';
import * as JSX from 'react/jsx-runtime';
import '../components';
import wrapJSX from '../jsx-wrapper.js';
import { StyleSheet } from '../sheet/StyleSheet.js';
import { createStylableComponent, stylizedComponents } from '../styled/index.js';
import type {
  NativeTwinGeneratedProps,
  ReactComponent,
  StylableComponentConfigOptions,
} from '../types/styled.types.js';
import { INTERNAL_RESET } from '../utils/constants.js';

const testingConfig = defineConfig({
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  root: {
    rem: 16,
  },
  theme: {
    extend: {
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

setup(testingConfig);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStyle(style?: CompleteStyle | CompleteStyle[]): R;
      toHaveAnimatedStyle(style?: CompleteStyle): R;
    }
  }
}

export const renderJSX = wrapJSX((JSX as any).jsx);
export const render: typeof tlRender = (component: any, options?: any) =>
  tlRender(renderJSX(component.type, component.props, component.key) as any, options);

/*
 * Creates a mocked component that renders with the defaultCSSInterop WITHOUT needing
 * set the jsxImportSource.
 */
export const createMockComponent = <
  const T extends ReactComponent<any>,
  const M extends StylableComponentConfigOptions<any> = {
    className: 'style';
  },
>(
  Component: T,
  mapping: M = {
    className: 'style',
  } as unknown as M,
) => {
  // return createStylableComponent(Component, mapping);

  const mock: any = jest.fn(({ ...props }, ref) => {
    props['ref'] = ref;
    return renderJSX(Component, props, '', false, undefined, undefined);
  });

  return Object.assign(createStylableComponent(forwardRef(mock), mapping), {
    mock,
  }) as unknown as ComponentType<ComponentProps<T> & NativeTwinGeneratedProps<M>> & {
    mock: typeof mock;
  };
};

// export const createRemappedComponent = <
//   const T extends ReactComponent<any>,
//   const M extends EnableStyledOptions<any> = {
//     className: 'style';
//   },
// >(
//   Component: T,
//   mapping: M = {
//     className: 'style',
//   } as unknown as M,
// ) => {
//   remapProps(Component, mapping);

//   const mock: any = jest.fn((props, ref) => {
//     props.ref = ref;
//     return renderJSX(Component, props, '', false, undefined, undefined);
//   });

//   return Object.assign(forwardRef(mock), { mock }) as unknown as ComponentType<
//     ComponentProps<T> & CssInteropGeneratedProps<M>
//   >;
// };

export const resetStyles = () => {
  StyleSheet[INTERNAL_RESET]();
};

export const resetComponents = () => {
  stylizedComponents.clear();
};

export function revealStyles(obj: any): any {
  switch (typeof obj) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
    case 'symbol':
    case 'undefined':
    case 'function':
      return obj;
    case 'object':
    default: {
      const style = null;
      if (style) return style;

      return Object.fromEntries(
        Object.entries(obj).map(([key, value]): any => {
          switch (typeof value) {
            case 'string':
            case 'number':
            case 'bigint':
            case 'boolean':
            case 'symbol':
            case 'undefined':
            case 'function':
              return [key, value];
            case 'object':
            default: {
              if (Array.isArray(value)) {
                return [key, value.map(revealStyles)];
              } else if (value) {
                const style = null;
                return [key, style ?? value];
              } else {
                return [key, value];
              }
            }
          }
        }),
      );
    }
  }
}
