import path from 'path';
import { runFixture, writeFixtureOutput } from './test.utils';

describe('run react compiler', () => {
  it('Create JSX tree', async () => {
    const result = await runFixture(path.join('jsx', 'code-ast.tsx'));

    expect(result).not.toBeNull();
  });

  it('Compile JSX', async () => {
    const fixturePath = path.join('jsx', 'code.tsx');
    const result = await runFixture(fixturePath);

    if (!result) {
      expect(result).not.toBeNull();
      return;
    }

    writeFixtureOutput(result, {
      fixturePath: path.dirname(fixturePath),
      outputFile: 'out.jsx',
    });
    expect(result).not.toBeNull();
  });
});
