import traverse from '@babel/traverse';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { Tree } from '@native-twin/helpers/tree';
import type { JSXElementNode, JSXElementTree, RuntimeTreeNode } from '../models';
import { BabelCompiler, BuildConfig } from '../services';
import { entriesToComponentData } from '../utils/code.utils';
import { addJsxAttribute, addJsxExpressionAttribute } from '../utils/jsx.utils';
import {
  extractSheetsFromTree,
  getJSXCompiledTreeRuntime,
  runtimeEntriesToAst,
} from '../utils/twin-jsx.utils';

export const compileReactCode = Effect.gen(function* () {
  const babel = yield* BabelCompiler;
  const input = yield* BuildConfig;

  return yield* Effect.Do.pipe(
    Effect.let('input', () => input),
    Effect.bind('ast', ({ input }) => babel.getAST(input.code, input.filename)),
    Effect.bind('trees', ({ ast, input }) =>
      babel.getJSXElementTrees(ast, input.filename),
    ),
    Effect.bind('registry', ({ trees, input }) =>
      getJSXElementRegistry(trees, input.filename),
    ),
    Effect.bind('output', ({ registry, input }) =>
      transformTrees(registry, input.platform),
    ),
    Effect.map((result) => {
      traverse(result.ast, {
        Program(p) {
          p.scope.crawl();
        },
      });
      return result;
    }),
  );
});

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
  Effect.sync(() => {
    if (platform === 'web') {
      return HashMap.empty<string, RuntimeTreeNode>();
    }
    return transformJSXElementTree(registry);
  });

const transformJSXElementTree = (trees: HashMap.HashMap<string, JSXElementNode>) => {
  return HashMap.map(trees, (node) => {
    const { leave, runtimeSheets } = getJSXCompiledTreeRuntime(
      node,
      Option.flatMap(node.parentID, (x) => HashMap.get(trees, x)),
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

export const getJSXElementRegistry = (
  babelTrees: Tree<JSXElementTree>[],
  filename: string,
) =>
  pipe(
    Stream.fromIterable(babelTrees),
    Stream.mapEffect((x) => extractSheetsFromTree(x, filename)),
    Stream.map(HashMap.fromIterable),
    Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) =>
      HashMap.union(prev, current),
    ),
  );
