<div align="center">
  <p align="center">
    <div>
      <img src="./assets/react-universal-tailwind-logo.png" alt="React Universal Tailwind Logo" width="70" height="70">
      <h1 align="center" style="color:skyblue;">Native Twin</h1>
    </div>
      <p>Native Twin simplifies the integration of Tailwind CSS framework in React Native apps. Our main goal is to bridge the gap for React web developers in need to write universal components for native and web. <br/> 
      This package allows developers to write Tailwind CSS classes with all states (active, hover, focus) that just works and looks as expected in native.</p>
  </p>
  <img alt="GitHub main branch checks state" src="https://img.shields.io/github/checks-status/react-universal/tailwind/main">
  <a href="http://commitizen.github.io/cz-cli/" target="_blank">
    <img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg">
  </a>
  <a href="https://www.npmjs.com/package/@native-twin/styled" target="_blank">
    <img alt="npm version" src="https://img.shields.io/npm/v/@native-twin/styled">
    <img alt="npm downloads" src="https://img.shields.io/npm/dt/@native-twin/styled">
  </a>
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/react-universal/tailwind">
  <img alt="GitHub" src="https://img.shields.io/github/license/react-universal/tailwind">
</div>
<br />

## Features

- Uses Tailwind CSS in React Native.
- Universal Design.
- Almost imperceptible at runtime.
- No Babel dependencies. (for now)
- **TypeScript** by default.
- CSS in TS.
- Visual States (_hover, active, focus_)
- Family styles
- Lightweight

## Installation

Install the package with yarn or npm:

```sh
npm install @native-twin/core @native-twin/babel @native-twin/jsx @native-twin/metro
# or
yarn add @native-twin/core @native-twin/babel @native-twin/jsx @native-twin/metro
```
Edit your babel config file

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // To enable our custom transformations in build time
          jsxImportSource: '@native-twin/jsx',
        },
      ],
      // Must be placed as last preset
      [
        '@native-twin/babel/babel',
        {
          twinConfigPath: './tailwind.config.ts',
          cssInput: 'globals.css',
        },
      ],
    ],

    plugins: ['react-native-reanimated/plugin'],
  };
};
```

Edit you `metro.config.js` file:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeTwin } = require('@native-twin/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];

// This step is only for monorepos
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */

module.exports = withNativeTwin(config, {
  configPath: path.join(__dirname, 'tailwind.config.ts'),
  inputCSS: 'global.css',
});
```

It is ready to use, no need to configure anything else.

## Usage

### First steps

**\*Native**

1. Create a config file

```ts
import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export default defineConfig({
  mode: 'native',
  root: {
    rem: 16,
  },
  theme: {
    // Almost same theme extension we already have on original tw
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
  // Enable the tailwind utilities
  presets: [presetTailwind()],
});
```

2. In your App.tsx entry point you need to setup the package

```ts
import { setup } from '@native-twin/core';
import tailwindConfig from './tailwind.config';

setup(tailwindConfig);
```

**\*nextJS (pages folder) (app folder is a work in progress)**

1. Create a config file

```ts
import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export default defineConfig({
  mode: 'web',
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
```

2. In your \_app.tsx you need to setup the package

```ts
import { setup } from '@native-twin/core';
import { installApp } from '@native-twin/nextjs';
import tailwindConfig from './tailwind.config';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Show case</title>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <div className='flex-1 bg-gray-200 flex'>
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default installApp(twConfig, MyApp);
```

3. In your \_document.tsx you need to setup the package (for SSR)

```tsx
import React from 'react';
import { AppRegistry } from 'react-native';
import { installDocument } from '@native-twin/core-nextjs/_document';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';

export async function getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
  AppRegistry.registerComponent('Main', () => Main);
  const { getStyleElement } = AppRegistry.getApplication('Main');
  const page = await ctx.renderPage();
  return { ...page, styles: getStyleElement() };
}

class MyDocument extends Document {
  getInitialProps = getInitialProps;
  override render() {
    const currentLocale = this.props.__NEXT_DATA__.locale || 'en';
    return (
      <Html lang={currentLocale}>
        <Head>
          <meta charSet='UTF-8' />
          <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
        </Head>
        <body className='min-h-screen min-w-full'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default installDocument(MyDocument);
```

Thats it now you can start using the styled components api.

### TW Grouping syntax

A common complain of Tailwind (and utility classes) is long and unwieldy class names in markup.
So inspired by twind we incorporate this syntax in this package

Example:

```ts
// Before variant grouping
cx`bg-red-500 shadow-xs sm:bg-red-600 sm:shadow-sm md:bg-red-700 md:shadow lg:bg-red-800 lg:shadow-xl`;

// After variant grouping
cx`
  bg-red-500 shadow-xs
  sm:(
    bg-red-600
    shadow-sm
  )
  md:(bg-red-700 shadow)
  lg:(bg-red-800 shadow-xl)
`;

cx`w-(1/2 sm:1/3 lg:1/6) p-2`;
// => w-1/2 sm:w-1/3 lg:w-1/6 p-2

// MIXED GROUPING

cx`sm:(border-(2 black opacity-50 hover:dashed))`
// => sm:border-2 sm:border-black sm:border-opacity-50 sm:hover:border-dashed
cx`border-(md:(2 black opacity-50 hover:dashed))`
// => sm:border-2 sm:border-black sm:border-opacity-50 sm:hover:border-dashed
cx`divide-(y-2 blue-500 opacity(75 md:50))`
// => divide-y-2 divide-blue-500 divide-opacity-75 md:divide-opacity-50
// Negated values can be used within the braces and will be applied to the directive:
cx`rotate-(-3 hover:6 md:(3 hover:-6))`
// => -rotate-3 hover:rotate-6 md:rotate-3 md:hover:-rotate-6"

// IMPORTANT GROUPING
cx`!(text-(sm green-500))`
```
### A Primitive RN Component

```tsx
import { Pressable, Text } from 'react-native';

const Button = () => {
  return (
    <Pressable className='p-2 bg-white items-center justify-center'>
      <Text className='text(2xl blue-200) leading-2'>Button Text</Text>
    </Pressable>
  );
};
```

### Universal components with CVA

```tsx
import { createVariants } from '@native-twin/core';

// This component does not have function initialization use as it returns
const buttonVariants = createVariants({
  base: 'font-semibold border rounded',
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white border-transparent hover:bg-blue-600',
      // **or**
      // primary: ['bg-blue-500', 'text-white', 'border-transparent', 'hover:bg-blue-600'],
      secondary: 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100',
    },
    size: {
      small: 'text-sm py-1 px-2',
      medium: 'text-base py-2 px-4',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
  },
});

const Button = (props) => {
  const className = buttonVariants(props);
  return (
    <Pressable className={className}>
      <Text className='text(2xl blue-200) leading-2'>Button Text</Text>
    </Pressable>
  );
};
```

By default, this library support Tailwind CSS classes adapted to mobile styles.

## TypeScript

`@native-twin/core` is written in TypeScript with complete definitions, so you don't need to install any other packages to use it with TypeScript. Also, it offers a `PropsFrom` helper to extract the props from any valid React component. and `VariantProps` to infer props from `createVariants` utility.

```tsx
import { PressableProps, Pressable } from 'react-native';
import { createVariants, VariantProps } from '@native-twin/styled';

const buttonVariants = createVariants({
  base: 'font-semibold border rounded',
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white border-transparent hover:bg-blue-600',
      // **or**
      // primary: ['bg-blue-500', 'text-white', 'border-transparent', 'hover:bg-blue-600'],
      secondary: 'bg-white text-gray-800 border-gray-400 hover:bg-gray-100',
    },
    size: {
      small: 'text-sm py-1 px-2',
      medium: 'text-base py-2 px-4',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
  },
});

type ButtonProps = VariantProps<typeof buttonVariants>;

const Button = (props: ButtonProps & PressableProps) => {
  const className = buttonVariants(props);
  return (
    <Pressable className={className}>
      <Text className='text(2xl blue-200) leading-2'>Button Text</Text>
    </Pressable>
  );
};
```

## Supported units:

Here is a list of the supported units: (pretty much all units from css)

- px
- %
- em
- rem
- deg
- vh
- vw
- rad
- turn
- pc
- cn
- ex
- in
- pt
- cm
- mm
- Q

#### Parameters

- `Component` - The component to style.
- `className` - The styles to apply.
- `tw` - The styles to apply.
- `base` - The base styles to apply to the component.
- `variants` - The variants to apply to the component.
- `defaultVariants` - The default variants to apply to the component.

## Contributing

Contributions are always welcome!

See `CONTRIBUTING.md` for ways to get started.

Please adhere to this project's `CODE_OF_CONDUCT.md`.

### Credits

- This library is heavily inspired in **twind** transforming CSS-to-JS, but without the use of **Babel** or **Tailwind CLI**, we have our own implementation of twind to create CSS and parse as RN StyleSheet at **runtime**
- **Twind** Thanks to the amazing DSL created for Sastan we were able to replicate tailwind for react native, also the vscode/ts plugins are heavily inspired by those create for the twind team.
- **clsx** The cx function was inspired by this package
- **Class Variant Authority** Our variants api took many ideas from CVA package, it aims to take those pain points away, allowing you to focus on the more fun aspects of UI development.
