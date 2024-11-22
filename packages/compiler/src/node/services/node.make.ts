import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { BabelCompiler, ReactCompilerService } from '../babel';
import { TwinFSService } from '../file-system';
import { NodeWithNativeTwinOptions } from '../metro/metro.types';
import { createTwinCSSFiles, getTwinCacheDir } from '../native-twin/twin.utils.node';
import { extractTwinConfig } from '../utils/twin.utils';
import { twinLoggerLayer } from './Logger.service';
import { TwinNodeContext } from './TwinNodeContext.service';

const DefaultLayer = TwinFSService.Live.pipe(
  Layer.provideMerge(ReactCompilerService.Live),
  Layer.provideMerge(BabelCompiler.Live),
);

export const makeNodeLayer = (config: NodeWithNativeTwinOptions) => {
  const projectRoot = config.projectRoot ?? process.cwd();
  const twinConfigPath = config.configPath ?? 'tailwind.config.ts';

  let inputCSS = config.inputCSS;
  const outputDir = config.outputDir ?? getTwinCacheDir();

  if (!inputCSS) {
    const files = createTwinCSSFiles({
      outputDir,
      inputCSS,
    });
    inputCSS = files.inputCSS;
  }

  const twinConfig = extractTwinConfig({ projectRoot, twinConfigPath });

  const nodeContext = TwinNodeContext.make({
    projectRoot,
    outputDir,
    debug: !!config.debug,
    twinConfigPath: twinConfig.twinConfigPath,
    inputCSS,
    twinConfig: twinConfig.config,
  });

  const MainLayer = Layer.empty
    .pipe(
      Layer.provideMerge(DefaultLayer),
      Layer.provideMerge(nodeContext),
    )
    .pipe(Layer.provide(twinLoggerLayer));

  const executor = ManagedRuntime.make(MainLayer);

  return {
    MainLayer,
    executor,
  };
};

export type TwinNodeLayer = ReturnType<typeof makeNodeLayer>;
