import { Array, HashMap, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { BabelCompilerContext } from '../src';
import { BabelCodeEntry } from '../src/services/BabelCompiler.service';
import { transformTrees } from '../src/utils/babel/babel.transform';
import { TestRuntime } from './test.utils';

const program = (input: BabelCodeEntry) =>
  Effect.gen(function* () {
    const compiler = yield* BabelCompilerContext;
    const result = yield* compiler.getBabelOutput(input);
    const registry = yield* compiler.transformAST(result.treeNodes, 'ios');
    const transformedTrees = yield* compiler.transformAST(result.treeNodes, 'ios');
    const mutated = yield* compiler.mutateAST(result.ast);

    return {
      result,
      mutated,
      transformedTrees,
      registry,
    };
  });
describe.only('Babel Compiler', () => {
  it('Test Compile code', async () => {
    const code = fs.readFileSync(
      path.join(__dirname, 'fixtures/twin-compiler/code.tsx'),
      'utf-8',
    );
    const output = await program({
      _tag: 'BabelCodeEntry',
      filename: path.join(__dirname, 'fixtures/twin-compiler/code.tsx'),
      platform: 'ios',
      code,
    }).pipe(TestRuntime.runPromise);

    console.log({
      code: output.mutated?.code,
      filename: output.result.filename,
      astTrees: pipe(
        HashMap.values(output.transformedTrees),
        Array.fromIterable,
        Array.flatMap((x) => x.leave.runtimeData),
      ),
    });
    expect(true).toBeTruthy();
  });
});
