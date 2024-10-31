import { Code } from '@/feactures/documentation/components/Code';
import { SubTitle } from '@/feactures/documentation/components/SubTitle';
import { Text } from '@/feactures/documentation/components/Text';
import { Title } from '@/feactures/documentation/components/Title';

export default function NativeTwinSetupGuide() {
  return (
    <div className='flex flex-col gap-10'>
      <Title>Setting up native-twin (expo app)</Title>
      <Text>This tutorial assumes you already have a React Native project set up.</Text>

      <SubTitle>1. Installation (npm or Yarn)</SubTitle>
      <Text>Choose either npm or Yarn for this step:</Text>

      <SubTitle>Using npm:</SubTitle>
      <Code
        codeString={
          'npm install @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms'
        }
      />

      <SubTitle>Using Yarn:</SubTitle>
      <Code
        codeString={
          'yarn add @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms'
        }
      ></Code>

      <SubTitle>2. Tailwind CSS Configuration</SubTitle>
      <Text>
        • Create a tailwind.config.js (or .ts if using TypeScript) file in your project's
        root directory.
      </Text>
      <Text>• Add this code:</Text>
      <Code
        codeString={`/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}', // Update with your app's entry point
    './src/**/*.{js,jsx,ts,tsx}', // Include paths to your components
  ],
  // ... other Tailwind CSS configurations (see: https://tailwindcss.com/docs/configuration) ...
};`}
      ></Code>

      <SubTitle>3. Babel Configuration</SubTitle>
      <Text>• Open your babel.config.js file.</Text>
      <Text>• Modify it to include:</Text>
      <Code
        codeString={`module.exports = function (api) {
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
          twinConfigPath: './tailwind.config.ts', // Path to your tailwind.config.js
          cssInput: 'globals.css', // Adjust if you use a different global CSS file
        },
      ],
    ],
    plugins: ['react-native-reanimated/plugin'], // Include any other necessary plugins
  };
};`}
      ></Code>

      <SubTitle>4. Metro Configuration</SubTitle>
      <Text>• Open your metro.config.js file.</Text>
      <Text>• Modify it to include:</Text>
      <Code
        codeString={`const { getDefaultConfig } = require('expo/metro-config');
const { withNativeTwin } = require('@native-twin/metro');
const path = require('path');
// ... other existing configurations
module.exports = withNativeTwin(
  // ... your existing metro config
  {
    configPath: path.join(__dirname, 'tailwind.config.ts'), // Path to your tailwind.config.js
  },
);`}
      ></Code>

      <SubTitle>5. Start Using native-twin</SubTitle>
      <Text>• In your React Native components, import the tw function:</Text>
      <Code codeString={"import tw from 'native-twin';"}></Code>
      <Text>• Apply Tailwind CSS classes using the tw function:</Text>
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
      ></Code>

      <Text>
        <strong>Remember:</strong> You may need to restart your development server after
        making these changes for them to take effect.
      </Text>
      <Text>
        While the sources provided do not have explicit instructions for using native-twin
        with Yarn, the configuration files (babel.config.js, metro.config.js,
        tailwind.config.js) remain the same for both npm and Yarn.
      </Text>
      <Text>
        This tutorial provides a general outline for setting up native-twin. Always refer
        to the official native-twin documentation (and Tailwind CSS documentation) for the
        most up-to-date information:
      </Text>
      <Text>• Native Twin: https://native-twin.dev/</Text>
      <Text>• Tailwind CSS: https://tailwindcss.com/</Text>
    </div>
  );
}
