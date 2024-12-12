import { Path } from '@effect/platform';
import { NodePath } from '@effect/platform-node';
import {
  BabelCompilerContextLive,
  CompilerConfigContext,
  type NodeWithNativeTwinOptions,
  TwinDocumentsContextLive,
  TwinFileSystem,
  TwinNodeContext,
  TwinWatcherContextLive,
  createCompilerConfig,
} from '@native-twin/compiler';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const MetroMainLayer = Layer.empty.pipe(
  Layer.provideMerge(TwinNodeContext.Live),
  Layer.provideMerge(BabelCompilerContextLive),
  Layer.provideMerge(TwinDocumentsContextLive),
);
export const MetroLayerWithTwinFS = TwinFileSystem.Live.pipe(
  Layer.provideMerge(MetroMainLayer),
);
export const MetroLayerWithTwinWatcher = TwinWatcherContextLive.pipe(
  Layer.provideMerge(TwinFileSystem.Live),
  Layer.provideMerge(MetroMainLayer),
);

export const createMetroInnerLayer = (nativeTwinConfig: NodeWithNativeTwinOptions) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const outDir =
      nativeTwinConfig.outputDir ??
      path.join(path.dirname(require.resolve('@native-twin/core')), '../..', '.cache');

    return MetroMainLayer.pipe(
      Layer.provideMerge(Layer.succeed(
        CompilerConfigContext,
        CompilerConfigContext.of(
          createCompilerConfig({
            rootDir: nativeTwinConfig.projectRoot ?? process.cwd(),
            outDir,
            inputCSS: nativeTwinConfig.inputCSS,
            twinConfigPath: nativeTwinConfig.twinConfigPath,
          }),
        ),
      ))
    );
  }).pipe(
    Layer.unwrapEffect,
    Layer.provide(NodePath.layerPosix),
  );
