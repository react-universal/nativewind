import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import fs from 'fs';
import path from 'path';
import * as TwinBabel from '../src/node/babel';
import { compileReactCode } from '../src/node/babel/programs/react.program';
import * as TwinNode from '../src/node';

const reactProgram = Effect.gen(function* () {
  const babel = yield* TwinBabel.BabelCompiler;
  const result = yield* compileReactCode.pipe(
    Effect.flatMap((x) => babel.buildFile(x.ast)),
  );

  return result;
}).pipe(Effect.scoped);

const MainLive = TwinBabel.makeBabelLayer;

export const createTestLayer = (input: TwinBabel.CompilerInput) => {
  return MainLive.pipe(
    Layer.provideMerge(TwinBabel.makeBabelConfig(input)),
    Layer.provideMerge(
      TwinNode.NativeTwinServiceNode.Live(
        input.twinConfigPath,
        input.projectRoot,
        input.platform,
      ),
    ),
  );
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
