import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { Tree } from '@native-twin/helpers/tree';
import type { JSXElementNode } from '../models/JSXElement.model';
import type { JSXElementTree, RuntimeTreeNode } from '../models/jsx.models';
import { entriesToComponentData } from '../utils/code.utils';
import {
  addJsxAttribute,
  addJsxExpressionAttribute,
  memberExpressionIsReactImport,
  identifierIsReactImport,
} from '../utils/jsx.utils';
import {
  extractSheetsFromTree,
  getJSXCompiledTreeRuntime,
  runtimeEntriesToAst,
} from '../utils/twin-jsx.utils';
import { BabelCompiler } from './BabelCompiler.service';

function addTwinPropsToElement(
  elementNode: JSXElementNode,
  entries: RuntimeComponentEntry[],
  options: {
    componentID: boolean;
    order: boolean;
    styledProps: boolean;
    templateStyles: boolean;
  },
) {
  const stringEntries = entriesToComponentData(elementNode.id, entries);
  const astProps = runtimeEntriesToAst(stringEntries);

  if (options.componentID) {
    addJsxAttribute(elementNode.path, '_twinComponentID', elementNode.id);
  }

  if (options.order) {
    addJsxAttribute(elementNode.path, '_twinOrd', elementNode.order);
  }

  if (options.styledProps && astProps) {
    addJsxExpressionAttribute(elementNode.path, '_twinComponentSheet', astProps);
  }
  return astProps;
}

const transformTrees = (
  registry: HashMap.HashMap<string, JSXElementNode>,
  platform: string,
) =>
  Effect.gen(function* () {
    if (platform === 'web') {
      return HashMap.empty<string, RuntimeTreeNode>();
    }
    return transformJSXElementTree(registry);
  });

const transformJSXElementTree = (trees: HashMap.HashMap<string, JSXElementNode>) => {
  return HashMap.map(trees, (node) => {
    const { leave, runtimeSheets } = getJSXCompiledTreeRuntime(
      node,
      pipe(
        node.parentID,
        Option.flatMap((x) => HashMap.get(trees, x)),
      ),
    );
    const runtimeAST = addTwinPropsToElement(leave, runtimeSheets, {
      componentID: true,
      order: true,
      styledProps: true,
      templateStyles: true,
    });
    return { leave, runtimeSheets, runtimeAST };
  });
};

const getJSXElementRegistry = (babelTrees: Tree<JSXElementTree>[], filename: string) =>
  Stream.fromIterable(babelTrees).pipe(
    Stream.mapEffect((x) => extractSheetsFromTree(x, filename)),
    Stream.map(HashMap.fromIterable),
    Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) =>
      HashMap.union(current, prev),
    ),
  );

const make = Effect.gen(function* () {
  const babel = yield* BabelCompiler;

  // const getTrees = (params: { code: string; filename: string; platform: string }) => {
  //   return Stream.Do.pipe(
  //     Stream.let('input', () => params),
  //     Stream.bind('ast', ({ input }) => babel.getAST(input.code, input.filename)),
  //     Stream.bind('trees', ({ ast, input }) =>
  //       babel.getJSXElementTrees(ast, input.filename),
  //     ),
  //     Stream.bind('registry', ({ trees, input }) =>
  //       getJSXElementRegistry(trees, input.filename),
  //     ),
  //     Stream.bind('output', ({ registry, input }) =>
  //       transformTrees(registry, input.platform),
  //     ),
  //   );
  // };

  return {
    // getTrees2: getTrees,
    getTrees: (code: string, filename: string) =>
      Effect.flatMap(babel.getAST(code, filename), (x) =>
        babel.getJSXElementTrees(x, filename),
      ),
    getRegistry: (trees: Tree<JSXElementTree>[], filename: string) =>
      getJSXElementRegistry(trees, filename),
    transformTress: transformTrees,
    memberExpressionIsReactImport,
    identifierIsReactImport,
  };
});

export class ReactCompilerService extends Context.Tag('babel/react/compiler')<
  ReactCompilerService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(ReactCompilerService, make);
}
