import { Effect, Layer, LogLevel, Logger, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FSUtils, TwinNodeContext, transformTwinDocument } from '../src';
import { TwinFileTree } from '../src/models/TwinFile.model';
import { TwinDocumentCtx } from '../src/services/TwinDocument.service';
import { getBabelAST } from '../src/utils/babel/babel.utils';
import { TestMainLive, TestRuntime, getFixture } from './test.utils';

const provideTextDocument = Effect.gen(function* () {
  const fs = yield* FSUtils.FsUtils;
  const { inputFile, writeOutput } = yield* getFixture('twin-compiler');
  const code = yield* fs.readFile(inputFile);
  const ast = yield* Effect.sync(() => getBabelAST(code, inputFile));

  return Layer.succeed(TwinDocumentCtx, {
    ast,
    platform: 'ios',
    textDocument: TextDocument.create(inputFile, '', 1, code),
  });
}).pipe(Effect.provide(TestMainLive), Layer.unwrapEffect);

describe.only('Babel Compiler', () => {
  it('extract babel paths', async () => {
    await TestRuntime.runPromise(
      transformTwinDocument.pipe(Effect.provide(provideTextDocument)),
    );
  });
  it('Text file tree', async () => {
    await Effect.gen(function* () {
      const fs = yield* FSUtils.FsUtils;
      const { inputFile, writeOutput } = yield* getFixture('twin-compiler');

      const code = yield* fs.readFile(inputFile);
      const { getTwForPlatform } = yield* TwinNodeContext;
      const ctx = yield* getTwForPlatform('ios');

      const file = new TwinFileTree(inputFile, code);
      const result = yield* file.transformBabelPaths(ctx);

      if (Option.isNone(result.output)) {
        return expect.fail('Cant compile file', inputFile);
      }

      const write = yield* writeOutput(result.output.value.code).pipe(
        Effect.match({
          onFailure: () => false,
          onSuccess: () => true,
        }),
      );
      expect(write).toBeTruthy();
    }).pipe(Logger.withMinimumLogLevel(LogLevel.All), TestRuntime.runPromise);
  });
});
