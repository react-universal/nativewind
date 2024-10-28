import path from 'path';
import { runPluginForFixture } from './test.utils';

describe('Babel exec test', () => {
  it('Test jsx plugin', () => {
    const code = runPluginForFixture(
      path.join(__dirname, './fixtures/jsx-plugin/code.tsx'),
      path.join(__dirname, './fixtures/jsx-plugin/out.jsx'),
    );

    expect(code).not.toBe('');
  });

  it('Test exec code', () => {
    const code = runPluginForFixture(
      path.join(__dirname, 'fixtures', 'twin-compiler', 'code.tsx'),
      path.join(__dirname, 'fixtures', 'twin-compiler', 'out.jsx'),
    );

    expect(code).not.toBe('ERROR!');
  });
});
