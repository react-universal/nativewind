// import traverse from '@babel/traverse';
// import * as Effect from 'effect/Effect';
// import { pipe } from 'effect/Function';
// import * as HashMap from 'effect/HashMap';
// import * as Option from 'effect/Option';
// import * as Stream from 'effect/Stream';
// import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
// import type { Tree } from '@native-twin/helpers/tree';
// import type { CompilerInput } from '../models/Babel.models.js';
// import type { JSXElementTree } from '../models/Babel.models.js';
// import type { JSXElementNode } from '../models/JSXElement.model.js';
// import { RuntimeTreeNode } from '../models/jsx.models.js';
// import { BabelCompiler } from '../services/BabelCompiler.service.js';
// import { entriesToComponentData } from '../utils/babel/code.utils.js';

// export const compileReactCode = (input: CompilerInput) =>
//   Effect.gen(function* () {
//     const babel = yield* BabelCompiler;
    
//     return yield* Effect.Do.pipe(
//       Effect.let('input', (): CompilerInput => input),
//       Effect.bind('ast', ({ input }) => babel.getAST(input.code, input.filename)),
//       Effect.bind('trees', ({ ast, input }) =>
//         babel.getJSXElementTrees(ast, input.filename),
//       ),
//       Effect.bind('registry', ({ trees, input }) =>
//         getJSXElementRegistry(trees, input.filename, input.platform),
//       ),
//       Effect.bind('output', ({ registry, input }) =>
//         transformTrees(registry, input.platform),
//       ),
//       Effect.map((result) => {
//         traverse(result.ast, {
//           Program(p) {
//             p.scope.crawl();
//           },
//         });
//         return result;
//       }),
//     );
//   });

// function addTwinPropsToElement(
//   elementNode: JSXElementNode,
//   entries: RuntimeComponentEntry[],
//   options: {
//     componentID: boolean;
//     order: boolean;
//     styledProps: boolean;
//     templateStyles: boolean;
//   },
// ) {
//   const stringEntries = entriesToComponentData(elementNode.id, entries);
//   const astProps = runtimeEntriesToAst(stringEntries);

//   if (options.componentID) {
//     addJsxAttribute(elementNode.path, '_twinComponentID', elementNode.id);
//   }

//   if (options.order) {
//     addJsxAttribute(elementNode.path, '_twinOrd', elementNode.order);
//   }

//   if (options.styledProps && astProps) {
//     addJsxExpressionAttribute(elementNode.path, '_twinComponentSheet', astProps);
//   }

//   return astProps;
// }

// const transformTrees = (
//   registry: HashMap.HashMap<string, JSXElementNode>,
//   platform: string,
// ) =>
//   Effect.sync(() => {
//     if (platform === 'web') {
//       return HashMap.empty<string, RuntimeTreeNode>();
//     }
//     return transformJSXElementTree(registry);
//   });

// const transformJSXElementTree = (trees: HashMap.HashMap<string, JSXElementNode>) => {
//   return HashMap.map(trees, (node) => {
//     const { leave, runtimeSheets } = getJSXCompiledTreeRuntime(
//       node,
//       Option.flatMap(node.parentID, (x) => HashMap.get(trees, x)),
//     );
//     const runtimeAST = addTwinPropsToElement(leave, runtimeSheets, {
//       componentID: true,
//       order: true,
//       styledProps: true,
//       templateStyles: true,
//     });
//     return { leave, runtimeSheets, runtimeAST };
//   });
// };

// export const getJSXElementRegistry = (
//   babelTrees: Tree<JSXElementTree>[],
//   filename: string,
//   platform: string,
// ) =>
//   pipe(
//     Stream.fromIterable(babelTrees),
//     Stream.mapEffect((x) => extractSheetsFromTree(x, filename, platform)),
//     Stream.map(HashMap.fromIterable),
//     Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) =>
//       HashMap.union(prev, current),
//     ),
//   );
