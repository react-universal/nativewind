import { Effect, LogLevel, Logger, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { FSUtils, TwinNodeContext } from '../src';
import { TwinFileTree } from '../src/models/TwinFile.model';
import { TestRuntime, getFixture } from './test.utils';

describe.only('Babel Compiler', () => {
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
