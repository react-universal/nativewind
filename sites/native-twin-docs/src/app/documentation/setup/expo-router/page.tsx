import { Code } from '@/feactures/documentation/components/Code';
import { SubTitle } from '@/feactures/documentation/components/SubTitle';
import { Text } from '@/feactures/documentation/components/Text';
import { Title } from '@/feactures/documentation/components/Title';

export default function NativeTwinExpoRouter() {
  return (
    <div className='flex flex-col gap-10'>
      <Title>Setting up native-twin (expo-router)</Title>

      <SubTitle>1. Installing Dependencies</SubTitle>
      <Text>Choose npm or Yarn:</Text>
      <Code
        codeString={`# Using npm
npm install @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms

# Using Yarn
yarn add @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms`}
      />

      <SubTitle>2. Configuring Tailwind CSS (tailwind.config.ts)</SubTitle>
      <Text>This file configures Tailwind CSS for your project.</Text>
      <Code
        codeString={`// /tailwind.config.ts
import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export const twinConfig = defineConfig({
  content: ['index.js', './App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  root: {
    rem: 20,
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
});

export default twinConfig;`}
      />

      <SubTitle>3. Configuring Babel (babel.config.js)</SubTitle>
      <Text>
        Babel is a JavaScript compiler that transforms your code into a format
        understandable by browsers and devices. The @native-twin/babel package includes a
        Babel preset that allows Babel to process your native-twin code properly.
      </Text>
      <Code
        codeString={`// /babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: '@native-twin/jsx',
        },
      ],
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
};`}
      />

      <SubTitle>4. Configuring Metro (metro.config.js)</SubTitle>
      <Text>
        Metro is the default JavaScript bundler used by React Native. It bundles all the
        JavaScript code in your app. In an Expo project, this bundling process is
        typically handled behind the scenes.
      </Text>
      <Code
        codeString={`// /metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeTwin } = require('@native-twin/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeTwin(config, {
  configPath: path.join(__dirname, 'tailwind.config.ts'),
});`}
      />

      <SubTitle>5. Using native-twin</SubTitle>
      <Text>
        After completing the configurations, restart your development server to apply the
        changes.
      </Text>
      <Text>Example:</Text>
      <Code
        codeString={`import { Text, View } from "react-native";
import tw from "native-twin";

const MyComponent = () => {
  return (
    <View style={tw\`bg-blue-500 p-4\`}>
      <Text style={tw\`text-white font-bold\`}>
        Hello, this is styled with native-twin!
      </Text>
    </View>
  );
};`}
      />

      <SubTitle>Key Points:</SubTitle>
      <Text>
        • Make sure to restart your development server after making changes to
        babel.config.js or metro.config.js.
      </Text>
      <Text>
        • Refer to the official documentation of native-twin for more detailed information
        and advanced usage.
      </Text>
      <Text>
        This tutorial, along with the official native-twin documentation, should help you
        successfully set up and use native-twin in your React Native Expo project.
      </Text>
    </div>
  );
}
