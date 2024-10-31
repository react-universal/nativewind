import { Code } from '@/feactures/documentation/components/Code';
import { SubTitle } from '@/feactures/documentation/components/SubTitle';
import { Text } from '@/feactures/documentation/components/Text';
import { Title } from '@/feactures/documentation/components/Title';

const NativeTwinNextJSSetupGuide = () => {
  return (
    <div className='flex flex-col gap-10'>
      <Title>Setting up native-twin (next-app)</Title>

      <SubTitle>1. Installing Dependencies</SubTitle>
      <Text>Choose npm or Yarn:</Text>
      <Code
        codeString={`# Using npm
npm install @native-twin/core @native-twin/jsx @native-twin/nextjs @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms

# Using Yarn
yarn add @native-twin/core @native-twin/jsx @native-twin/nextjs @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms`}
      />

      <SubTitle>2. Configuring Tailwind CSS (tailwind.config.js)</SubTitle>
      <Text>This file configures Tailwind CSS for your project.</Text>
      <Code
        codeString={`// /tailwind.config.js
import { defineConfig } from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';

export default defineConfig({
  root: {
    rem: 14,
  },
  mode: 'web',
  presets: [presetTailwind()],
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
});`}
      />

      <SubTitle>3. Modify tsconfig.json</SubTitle>
      <Text>
        Update the jsxImportSource to @native-twin/jsx to enable JSX support in your
        TypeScript files.
      </Text>
      <Code
        codeString={`// /tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "jsxImportSource": "@native-twin/jsx",
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "sourceMap": true,
    "moduleResolution": "node",
    "noUnusedLocals": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "isolatedModules": true,
    "incremental": true,
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "resolveJsonModule": true
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", "app-env.d.ts"],
  "exclude": ["node_modules", "jest.config.ts"],
  "references": []
}`}
      />

      <SubTitle>4. Wrap Your App Component (pages/_app.tsx)</SubTitle>
      <Text>
        Wrap your root App component with the installApp function from
        @native-twin/nextjs/_app. This step ensures that native-twin styles are applied
        correctly in your Next.js application.
      </Text>
      <Code
        codeString={`// /_app.tsx
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { installApp } from '@native-twin/nextjs/_app';
import '../styles/globals.css';
import twConfig from '../tailwind.config';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      Show case
    </>
  );
}

export default installApp(twConfig, MyApp);`}
      />

      <SubTitle>5. Wrap Your Document Component (pages/_document.tsx)</SubTitle>
      <Text>
        In your _document.tsx file, import installDocument from
        @native-twin/nextjs/_document and use it to wrap your custom Document component.
        This ensures that native-twin integrates correctly with Next.js's server-side
        rendering.
      </Text>
      <Code
        codeString={`// /_document.tsx
import { AppRegistry } from 'react-native';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';
import { installDocument } from '@native-twin/nextjs/_document';

export async function getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
  AppRegistry.registerComponent('Main', () => Main);
  // @ts-expect-error
  const { getStyleElement } = AppRegistry.getApplication('Main');

  const page = await ctx.renderPage();

  return { ...page };
}

class MyDocument extends Document {
  getInitialProps = getInitialProps;

  override render() {
    const currentLocale = this.props.__NEXT_DATA__.locale || 'en';

    return (
      {/* Your document structure here */}
    );
  }
}

export default installDocument(MyDocument);`}
      />

      <SubTitle>6. Using native-twin</SubTitle>
      <Text>After completing these configurations, restart your development server.</Text>
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
        tsconfig.json.
      </Text>
      <Text>
        • Refer to the official documentation of native-twin for more detailed information
        and advanced usage.
      </Text>
      <Text>
        This tutorial, along with the official native-twin documentation, should help you
        successfully set up and use native-twin in your Next.js project.
      </Text>
    </div>
  );
};

export default NativeTwinNextJSSetupGuide;
