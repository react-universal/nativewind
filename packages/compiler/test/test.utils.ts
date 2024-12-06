import { ManagedRuntime } from 'effect';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import fs from 'fs';
import path from 'path';
import {
  BabelCompiler,
  CompilerConfigContext,
  createCompilerConfig,
  TwinFileSystem,
  TwinNodeContext,
} from '../src';

const outputDir = path.join(__dirname, '.cache');
const compilerContext = Layer.succeed(
  CompilerConfigContext,
  createCompilerConfig({
    outDir: outputDir,
    rootDir: __dirname,
    twinConfigPath: path.join(__dirname, 'tailwind.config.ts'),
  }),
);
// const tw = createTailwind(tailwindConfig, createVirtualSheet());
const TestMainLive = Layer.empty.pipe(
  Layer.provideMerge(TwinFileSystem.Live),
  Layer.provideMerge(BabelCompiler.Live),
  Layer.provide(TwinNodeContext.Live),
  Layer.provideMerge(compilerContext),
);

export const TestRuntime = ManagedRuntime.make(TestMainLive);

const reactProgram = (file: string) =>
  Effect.gen(function* () {
    const babel = yield* BabelCompiler;
    const result = yield* babel.getBabelOutput({
      _tag: 'BabelFileEntry',
      filename: file,
      platform: 'ios',
    });

    return result;
  }).pipe(Effect.scoped);

export const runFixture = (fixturePath: string) => {
  const filePath = path.join(__dirname, 'fixtures', fixturePath);
  const code = fs.readFileSync(filePath);

  return reactProgram(path.join(__dirname, './tailwind.config.ts')).pipe(
    TestRuntime.runPromise,
  );
};

export const writeFixtureOutput = (
  code: string,
  paths: { fixturePath: string; outputFile: string },
) => {
  const filePath = path.join(__dirname, 'fixtures', paths.fixturePath, paths.outputFile);
  fs.writeFileSync(filePath, code);
  return code;
};
