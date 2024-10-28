// import * as t from '@babel/types';
// import upstreamTransformer from '@expo/metro-config/babel-transformer';
// import * as Context from 'effect/Context';
// import * as Effect from 'effect/Effect';
// import { pipe } from 'effect/Function';
// import * as HashMap from 'effect/HashMap';
// import * as Layer from 'effect/Layer';
// import * as Option from 'effect/Option';
// import micromatch from 'micromatch';
// import nodePath from 'node:path';
// import path from 'node:path';
// import { RuntimeComponentEntry } from '@native-twin/css/jsx';
// import { addTwinPropsToElement } from '../jsx/ast/jsx.builder';
// import { getJSXCompiledTreeRuntime } from '../jsx/ast/jsx.maps';
// import { JSXElementNode } from '../models';
// import { BabelTransformerConfig, BabelTransformerFn } from '../models/metro.models';
// import { NativeTwinService } from './NativeTwin.service';

// export class MetroBabelCompiler extends Context.Tag('metro/babel/transformer-context')<
//   MetroBabelCompiler,
//   BabelTransformerConfig
// >() {
//   static make = (
//     { filename, options, src }: Parameters<BabelTransformerFn>[0],
//     generate: BabelTransformerConfig['generate'],
//   ) =>
//     Layer.effect(
//       MetroBabelCompiler,
//       Effect.gen(function* () {
//         const twin = yield* NativeTwinService;
//         const outputCSS = options.customTransformOptions.outputCSS;
//         const platform = options.platform;

//         return {
//           generate,
//           options,
//           outputCSS,
//           code: src,
//           filename,
//           inputCSS: options.customTransformOptions.inputCSS,
//           allowedPaths: twin.config.content.map((x) =>
//             path.resolve(options.projectRoot, path.join(x)),
//           ),
//           platform,
//         };
//       }),
//     );
// }

// export class BabelTransformerService extends Context.Tag('babel/TransformerService')<
//   BabelTransformerService,
//   {
//     isNotAllowedPath(path: string): boolean;
//     isCssFile: (filePath: string) => boolean;
//     transform(code: string): Promise<any>;
//     transformLeave: (trees: HashMap.HashMap<string, JSXElementNode>) => HashMap.HashMap<
//       string,
//       {
//         leave: JSXElementNode;
//         runtimeSheet: RuntimeComponentEntry[];
//         runtimeAST: t.Expression | null | undefined;
//       }
//     >;
//   }
// >() {}

// export const BabelTransformerServiceLive = Layer.effect(
//   BabelTransformerService,
//   Effect.gen(function* () {
//     const ctx = yield* MetroBabelCompiler;
//     return {
//       // compileCode: (code) => twinBabelPluginTransform(code),
//       isNotAllowedPath: (file) => {
//         return !micromatch.isMatch(
//           nodePath.resolve(ctx.options.projectRoot, file),
//           ctx.allowedPaths,
//         );
//       },
//       isCssFile: (filePath) => {
//         return /\.css$/.test(filePath);
//       },
//       transformLeave: (trees) => {
//         return HashMap.map(trees, (node) => {
//           const { leave, runtimeSheet } = getJSXCompiledTreeRuntime(
//             node,
//             pipe(
//               node.parentID,
//               Option.flatMap((x) => HashMap.get(trees, x)),
//             ),
//           );
//           const runtimeAST = addTwinPropsToElement(leave, runtimeSheet, ctx.generate);
//           return { leave, runtimeSheet, runtimeAST };
//         });
//       },

//       transform: (code) => {
//         // @ts-expect-error untyped
//         return upstreamTransformer.transform({
//           src: code,
//           options: ctx.options,
//           filename: ctx.filename,
//         });
//       },
//     };
//   }),
// );

// // const twinBabelPluginTransform = (code: string) =>
// //   Effect.gen(function* () {
// //     const ctx = yield* BabelTransformerContext;
// //     const generated = transformSync(code, {
// //       // parserOpts: {
// //       //   plugins: ['jsx', 'typescript'],
// //       // },
// //       code: false,
// //       plugins: [
// //         [
// //           nativeTwinJSXBabelPlugin,
// //           {
// //             twinConfigPath: './tailwind.config.ts',
// //           },
// //         ],
// //       ],
// //       sourceType: 'unambiguous',
// //       filename: ctx.filename,
// //       ast: true,
// //       cwd: ctx.options.projectRoot,
// //       envName: process.env['NODE_ENV'],
// //       minified: false,
// //       generatorOpts: {
// //         minified: false,
// //       },
// //       compact: false,
// //     });

// //     return Option.fromNullable(generated?.ast);

// //     function nativeTwinJSXBabelPlugin(
// //       _: BabelAPI,
// //       options: TwinBabelOptions,
// //       cwd: string,
// //     ): PluginObj<TwinVisitorsState> {
// //       return {
// //         inherits: babelJSX,
// //         pre() {
// //           this.visited = HashMap.empty();
// //           this.tree = {
// //             _tag: 'tree',
// //             value: [],
// //           };
// //         },
// //         visitor: {
// //           // Program: {
// //           //   exit(state) {
// //           //     this;
// //           //     console.log('THESSS', state);
// //           //   },
// //           // },
// //           JSXElement: {
// //             exit() {
// //               if (this.tree.value.length > 1) {
// //                 const child = this.tree.value.pop();
// //                 const parent = this.tree.value[this.tree.value.length - 1];
// //                 if (child && parent) {
// //                   parent.childs.push(child);
// //                 }
// //               }
// //             },
// //             enter(path) {
// //               // console.log('STATE: ', state, this);
// //               const key = babelJsxElementNodeKey(path.node, ctx.filename);
// //               const elementNode = pipe(
// //                 this.visited,
// //                 HashMap.get(key),
// //                 Option.match({
// //                   onNone: () => {
// //                     console.log('NOT_CACHED');
// //                     return new BabelJSXElementNode(path.node, 0, ctx.filename, null);
// //                   },
// //                   onSome: (a) => {
// //                     console.log('CACHED: ');
// //                     return a;
// //                   },
// //                 }),
// //               );
// //               const sheet = elementNode.getTwinSheet(
// //                 ctx.twin,
// //                 ctx.twinCtx,
// //                 HashSet.size(elementNode.childs),
// //               );

// //               addTwinPropsToElement(elementNode, sheet.propEntries, ctx.generate);
// //               // updateVisitedNodes(key, elementNode, sheet);
// //               this.visited = pipe(
// //                 this.visited,
// //                 HashMap.set(key, elementNode),
// //                 HashMap.union(
// //                   HashMap.fromIterable(
// //                     HashSet.map(elementNode.childs, (x) =>
// //                       Tuple.make(babelJsxElementNodeKey(x.path, ctx.filename), x),
// //                     ),
// //                   ),
// //                 ),
// //               );
// //               this.tree.value.push({
// //                 childs: [],
// //                 filename: elementNode.filename,
// //                 id: elementNode.id,
// //                 node: getJSXElementName(elementNode.openingElement).pipe(
// //                   Option.getOrElse(() => 'Unknown'),
// //                 ),
// //                 order: elementNode.order,
// //                 parentNode: null,
// //                 source: elementNode.binding(path).pipe(
// //                   Option.map((x) => x.source),
// //                   Option.getOrElse(() => 'Local'),
// //                 ),
// //               });
// //             },
// //           },
// //         },
// //       };
// //     }
// //   });
