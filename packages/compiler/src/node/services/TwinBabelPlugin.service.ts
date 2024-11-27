import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import type { CompilerContext } from '@native-twin/css/jsx';
import type { TwinBabelPluginOptions } from '../models/Babel.models.js';
import type { JSXElementNode, JSXElementNodeKey } from '../models/JSXElement.model.js';
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

        const twCtx: CompilerContext = {
          baseRem: nodeContext.twinConfig.root.rem,
          platform: options.platform,
        };

        const visitedElements = HashMap.empty<JSXElementNodeKey, JSXElementNode>();

        return {
          options,
          rootPath,
          twCtx,
          visitedElements,
          allowedPaths: (yield* nodeContext.scanAllowedPaths).files,
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
