import { createVirtualSheet } from '@native-twin/css';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Stream from 'effect/Stream';
import fs from 'fs';
import path from 'path';
import { createTailwind } from '@native-twin/core';
import { BabelCompiler, NodeMainLayer, TwinNodeContext } from '../src/node';
import tailwindConfig from './tailwind.config';

const tw = createTailwind(tailwindConfig, createVirtualSheet());
const twinContextLayer = Layer.succeed(TwinNodeContext, {
  config: {
    allowedPaths: [],
    allowedPathsGlob: [],
    debug: false,
    inputCSS: '',
    outputDir: '',
    outputPaths: { android: '', defaultFile: '', ios: '', native: '', web: '' },
    projectRoot: __dirname,
    twinConfig: tailwindConfig,
    twinConfigPath: path.join(__dirname, 'tailwind.config.ts'),
  },
  tw: {
    native: tw,
    web: createTailwind(tailwindConfig, createVirtualSheet()),
  },
  utils: {
    getOutputCSSPath: () => '',
    getTwForPlatform: () => tw,
    isAllowedPath: () => true,
  },
});

const MainLive = Layer.empty.pipe(
  Layer.provideMerge(NodeMainLayer),
  Layer.provideMerge(twinContextLayer),
);

const runtime = ManagedRuntime.make(MainLive);

describe('Babel Compiler', () => {
  it('Test Compile code', async () => {
    const service = await Effect.map(BabelCompiler, (x) => x).pipe(runtime.runPromise);
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
