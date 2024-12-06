import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { BabelCompiler } from '../src';
import { TestRuntime } from './test.utils';

describe('Babel Compiler', () => {
  it('Test Compile code', async () => {
    const service = await Effect.map(BabelCompiler, (x) => x).pipe(
      TestRuntime.runPromise,
    );
    const code = fs.readFileSync(
      path.join(__dirname, 'fixtures/twin-compiler/code.tsx'),
      'utf-8',
    );
    const output = await service
      .getBabelOutput({
        _tag: 'BabelFileEntry',
        filename: path.join(__dirname, 'fixtures/twin-compiler/code.tsx'),
        platform: 'native',
      })
      .pipe(
        Stream.runCollect,
        Effect.map((x) => Array.fromIterable(x)),
        Effect.runPromise,
      );

    console.log(output, code);
    expect(true).toBeTruthy();
  });
});
