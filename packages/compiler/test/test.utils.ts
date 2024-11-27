import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import fs from 'fs';
import path from 'path';
import { makeNodeLayer } from '../src/node';
import { BabelCompiler, CompilerInput, makeBabelConfig } from '../src/node/babel';
import { compileReactCode } from '../src/node/babel/programs/react.program';

const reactProgram = Effect.gen(function* () {
  const babel = yield* BabelCompiler;
  const result = yield* compileReactCode.pipe(
    Effect.flatMap((x) => babel.buildFile(x.ast)),
  );

  return result;
}).pipe(Effect.scoped);

export const createTestLayer = (input: CompilerInput) => {
  const nodeLayer = makeNodeLayer({
    configPath: input.twinConfigPath,
    logLevel: true,
    inputCSS: input.inputCSS,
    outputDir: path.dirname(input.outputCSS),
    projectRoot: input.projectRoot,
  });
  return makeBabelConfig(input).pipe(Layer.provideMerge(nodeLayer.MainLayer));
};

export const runFixture = (fixturePath: string) => {
  const filePath = path.join(__dirname, 'fixtures', fixturePath);
  const code = fs.readFileSync(filePath);
  const layer = createTestLayer({
    code: code.toString(),
    filename: filePath,
    inputCSS: '',
    outputCSS: '',
    platform: 'ios',
    projectRoot: process.cwd(),
    twinConfigPath: path.join(__dirname, './tailwind.config.ts'),
  });

  return reactProgram.pipe(Effect.provide(layer), Effect.runPromise);
};

export const writeFixtureOutput = (
  code: string,
  paths: { fixturePath: string; outputFile: string },
) => {
  const filePath = path.join(__dirname, 'fixtures', paths.fixturePath, paths.outputFile);
  fs.writeFileSync(filePath, code);
  return code;
};
