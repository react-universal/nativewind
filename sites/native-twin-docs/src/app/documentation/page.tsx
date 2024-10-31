import { normalText } from '@/constants/colors';
import { Code } from '@/feactures/documentation/components/Code';
import { SubTitle } from '@/feactures/documentation/components/SubTitle';
import { Text } from '@/feactures/documentation/components/Text';
import { Title } from '@/feactures/documentation/components/Title';

export default function DocsPage() {
  return (
    <div className='flex flex-col gap-10'>
      <Title>
        Effortlessly style your React Native and React applications with the familiar
        utility-first syntax of Tailwind CSS.
      </Title>

      <SubTitle>Introduction to native-twin</SubTitle>
      <Text>
        native-twin allows developers to apply Tailwind CSS styling across both React
        Native (for mobile) and React (for web) applications. With a familiar syntax,
        developers can leverage their existing knowledge of Tailwind CSS for seamless
        application styling. Built with performance in mind, native-twin ensures efficient
        rendering and a smooth user experience.
      </Text>

      <SubTitle>Key Features</SubTitle>
      <ul style={{ color: normalText }} className='flex flex-col gap-5'>
        <li>
          <strong style={{ color: 'whitesmoke' }}> Unified Styling:</strong> Write a
          single set of Tailwind CSS classes that translate effectively to
          platform-specific styles for both web and mobile.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}> Component-Based Approach:</strong>{' '}
          Encourages a modular design system by enabling the creation of reusable, styled
          components.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>Theme Customization:</strong> Extend and
          customize the default Tailwind CSS theme to match your brand or application's
          design language.
        </li>
      </ul>

      <SubTitle>Getting Started</SubTitle>
      <Text>Follow these steps to integrate native-twin into your project:</Text>

      <SubTitle>1. Installation (npm or Yarn)</SubTitle>
      <Text>Choose either npm or Yarn for this step:</Text>
      <Code
        codeString={`Using npm:
npm install @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms`}
      />
      <Code
        codeString={`Using Yarn:
yarn add @native-twin/core @native-twin/babel @native-twin/dev-tools @native-twin/jsx @native-twin/metro @native-twin/preset-tailwind @native-twin/styled tailwindcss @tailwindcss/forms`}
      />

      <SubTitle>2. Package Breakdown</SubTitle>
      <ul style={{ color: normalText }} className=' flex flex-col gap-5'>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/core:</strong> The heart of
          native-twin that processes Tailwind CSS classes into platform-specific styles.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/babel:</strong> Contains
          the Babel plugin essential for transforming Tailwind CSS classes during the
          build process.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/dev-tools:</strong>{' '}
          Provides developer tools and utilities to streamline the styling workflow.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/jsx:</strong> Enables the
          use of native-twin's styling approach directly within JSX code.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/metro:</strong> Ensures
          compatibility and smooth integration if using Metro bundler in React Native
          projects.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/preset-tailwind:</strong>{' '}
          Includes predefined Tailwind CSS configurations tailored for use with
          native-twin.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@native-twin/styled:</strong> Provides a
          way to create styled components using native-twin, combining Tailwind CSS
          benefits with a component-based architecture.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>tailwindcss:</strong> The core Tailwind
          CSS package providing all utility classes.
        </li>
        <li>
          <strong style={{ color: 'whitesmoke' }}>@tailwindcss/forms:</strong> Extends
          Tailwind CSS with additional utility classes specifically designed for styling
          form elements.
        </li>
      </ul>
    </div>
  );
}
