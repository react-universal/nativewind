import type { CompilerContext } from '@native-twin/css/jsx';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import type { TwinBabelPluginOptions } from '../models/Babel.models.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

export class JSXImportPluginContext extends Context.Tag('babel/plugin/context')<
  JSXImportPluginContext,
  {
    rootPath: string;
    options: TwinBabelPluginOptions;
    allowedPaths: string[];
    twCtx: CompilerContext;
    isValidFile: (filename?: string) => boolean;
  }
>() {
  static make = (options: TwinBabelPluginOptions, rootPath: string) =>
    Layer.scoped(
      JSXImportPluginContext,
      Effect.gen(function* () {
        const nodeContext = yield* TwinNodeContext;
        const twinConfig = yield* nodeContext.state.twinConfig.get;
        const twCtx: CompilerContext = {
          baseRem: twinConfig.root.rem,
          platform: options.platform,
        };

        const visitedElements = HashMap.empty<any, any>();

        return {
          options,
          rootPath,
          twCtx,
          visitedElements,
          allowedPaths: yield* nodeContext.getProjectFilesFromConfig(twinConfig),
          isValidFile(filename = '') {
            const allowedFileRegex =
              /^(?!.*[/\\](react|react-native|react-native-web|@native-twin\/*)[/\\]).*$/;
            if (!nodeContext.isAllowedPath(filename)) {
              return false;
            }
            return allowedFileRegex.test(filename);
          },
        };
      }),
    );
}
