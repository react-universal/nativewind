import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import type { CompilerContext } from '@native-twin/css/jsx';
import { TwinNodeContext } from '../../services/TwinNodeContext.service';
import type { TwinBabelPluginOptions } from '../babel.types';
import type { JSXElementNode, JSXElementNodeKey } from '../models/JSXElement.model';

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
          baseRem: nodeContext.config.twinConfig.root.rem,
          platform: options.platform,
        };

        const visitedElements = HashMap.empty<JSXElementNodeKey, JSXElementNode>();

        return {
          options,
          rootPath,
          twCtx,
          visitedElements,
          allowedPaths: nodeContext.config.allowedPaths,
          isValidFile(filename = '') {
            const allowedFileRegex =
              /^(?!.*[/\\](react|react-native|react-native-web|@native-twin\/*)[/\\]).*$/;
            if (!nodeContext.utils.isAllowedPath(filename)) {
              return false;
            }
            return allowedFileRegex.test(filename);
          },
        };
      }),
    );
}
