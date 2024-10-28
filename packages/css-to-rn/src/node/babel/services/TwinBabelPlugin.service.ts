import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import type { CompilerContext } from '@native-twin/css/jsx';
import { NativeTwinServiceNode } from '../../native-twin';
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
        const twin = yield* NativeTwinServiceNode;
        const twCtx: CompilerContext = {
          baseRem: twin.config.root.rem,
          platform: options.platform,
        };

        const visitedElements = HashMap.empty<JSXElementNodeKey, JSXElementNode>();

        return {
          options,
          rootPath,
          twCtx,
          visitedElements,
          allowedPaths: twin.allowedPaths,
          isValidFile(filename = '') {
            const allowedFileRegex =
              /^(?!.*[/\\](react|react-native|react-native-web|@native-twin\/*)[/\\]).*$/;
            if (!twin.isAllowedPath(filename)) {
              return false;
            }
            return allowedFileRegex.test(filename);
          },
        };
      }),
    );
}
