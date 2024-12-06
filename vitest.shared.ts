import type { ViteUserConfig } from 'vitest/config';

// const alias = (name: string) => {
//   const target = process.env.TEST_DIST !== undefined ? 'build/esm' : 'src';
//   return {
//     [`${name}/test`]: path.join(__dirname, 'packages', name, 'test'),
//     [`${name}`]: path.join(__dirname, 'packages', name, target),
//   };
// };

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: ViteUserConfig = {
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    exclude: ['react-native', 'react-native-web'],
  },
  test: {
    // setupFiles: [path.join(__dirname, 'setupTests.ts')],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: true,
    },
    include: ['test/**/*.test.ts'],
  },
};

export default config;
