import generate, { GeneratorResult } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { Path } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { PlatformError } from '@effect/platform/Error';
import { FileSystem } from '@effect/platform/FileSystem';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe, apply } from 'effect/Function';
import * as Hash from 'effect/Hash';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import {
  applyParentEntries,
  CompilerContext,
  RuntimeComponentEntry,
} from '@native-twin/css/jsx';
import { Tree, TreeNode } from '@native-twin/helpers/tree';
import {
  type JSXElementNodePath,
  JSXElementTree,
  TransformedJSXElementTree,
} from '../models/Babel.models.js';
import { JSXElementNode } from '../models/JSXElement.model.js';
import { JSXMappedAttribute } from '../models/jsx.models.js';
import { InternalTwFn } from '../models/twin.types.js';
import {
  addTwinPropsToElement,
  getElementEntries,
  getJSXElementName,
  getJSXElementSource,
} from '../utils/babel/babel.jsx.js';
import * as babelPredicates from '../utils/babel/babel.predicates.js';
import {
  extractMappedAttributes,
  getBabelAST,
  identifierIsReactImport,
  memberExpressionIsReactImport,
} from '../utils/babel/babel.utils.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

interface BaseEntry {
  readonly filename: string;
}
export interface BabelFileEntry extends BaseEntry {
  readonly _tag: 'BabelFileEntry';
  readonly platform: string;
}
interface BabelCodeEntry extends BaseEntry {
  readonly _tag: 'BabelCodeEntry';
  readonly code: string;
  readonly platform: string;
}

interface ExtractedAttributes {
  runtimeData: JSXMappedAttribute[];
  node: TreeNode<JSXElementTree>;
}

export interface BabelOutput {
  platform: string;
  filename: string;
  code: string;
  tw: InternalTwFn;
  styledCtx: CompilerContext;
  ast: ParseResult<t.File>;
  trees: Tree<JSXElementTree>[];
  treeNodes: HashMap.HashMap<string, JSXElementNode>;
  entries: RuntimeComponentEntry[];
}

const makeJSXElementNode = (
  filename: string,
  extractedAttributes: ExtractedAttributes,
  entries: RuntimeComponentEntry[],
) =>
  new JSXElementNode({
    leave: extractedAttributes.node,
    order: extractedAttributes.node.value.order,
    filename,
    runtimeData: extractedAttributes.runtimeData,
    entries,
  });
const make = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const fs = yield* FileSystem;

  const getBabelOutput = (input: BabelCodeEntry | BabelFileEntry) =>
    Effect.Do.pipe(
      Effect.let('platform', () => input.platform),
      Effect.let('filename', () => input.filename),
      Effect.bind('code', () => getCompilerInputCode(input)),
      Effect.bind('tw', ({ platform }) => ctx.getTwForPlatform(platform)),
      Effect.let(
        'styledCtx',
        ({ platform, tw }): CompilerContext => ({
          baseRem: tw.config.root.rem ?? 16,
          platform,
        }),
      ),
      Effect.let('ast', ({ code, filename }) => getBabelAST(code, filename)),
      Effect.bind('trees', ({ ast, filename }) => streamJsxElementTrees(ast, filename)),
      Effect.bind('treeNodes', ({ trees, filename, tw, styledCtx }) =>
        Stream.mergeAll(
          RA.map(trees, (tree) => mappedAttributes(tree)),
          { concurrency: 'unbounded' },
        ).pipe(
          Stream.map((extracted) =>
            makeJSXElementNode(
              filename,
              extracted,
              getElementEntries(extracted.runtimeData, tw, styledCtx),
            ),
          ),
          Stream.run(
            Sink.collectAllToMap(
              (x) => x.id,
              (x) => x,
            ),
          ),
        ),
      ),
      Effect.let('entries', ({ treeNodes }) =>
        pipe(
          RA.fromIterable(HashMap.values(treeNodes)),
          RA.flatMap((x) => x.entries),
        ),
      ),
    );

  return {
    getCompilerInputCode,
    getBabelOutput,
    transformAST: transformTrees,
    getJSXElementTrees: streamJsxElementTrees,
    getJSXCompiledTreeRuntime,
    extractLanguageRegions,
    memberExpressionIsReactImport,
    identifierIsReactImport,
    mutateAST: (ast: ParseResult<t.File>) =>
      Effect.sync(() => Option.fromNullable(generate(ast)).pipe(Option.getOrNull)),
  };

  function getCompilerInputCode(input: BabelFileEntry | BabelCodeEntry) {
    return Effect.gen(function* () {
      switch (input._tag) {
        case 'BabelCodeEntry':
          return input.code;
        case 'BabelFileEntry':
          return yield* fs.readFileString(input.filename, 'utf-8');
      }
    });
  }

  function mappedAttributes(tree: Tree<JSXElementTree>) {
    return Stream.async<ExtractedAttributes>((emit) => {
      tree.traverse(async (leave) => {
        await emit.single({
          node: leave,
          runtimeData: extractMappedAttributes(leave.value.babelNode),
        });
        // const model = jsxTreeNodeToJSXElementNode(leave, entries, fileName);
      }, 'breadthFirst');

      emit.end();
    });
  }
  // function extractSheetsFromTree(
  //   tree: Tree<JSXElementTree>,
  //   tw: InternalTwFn,
  //   ctx: CompilerContext,
  // ) {
  //   const fileSheet = RA.empty<[string, JSXElementNode]>();

  //   Stream.async<ExtractedEntries>((emit) => {
  //     tree.traverse(async (leave) => {
  //       const runtimeData = extractMappedAttributes(leave.value.babelNode);
  //       const entries = getElementEntries(runtimeData, tw, ctx);
  //       // const model = jsxTreeNodeToJSXElementNode(leave, entries, fileName);

  //       await emit.single({
  //         entries,
  //         node: leave,
  //         runtimeData,
  //       });
  //     }, 'breadthFirst');

  //     return Effect.promise(() => emit.end());
  //   });

  //   return fileSheet;
  // }

  // function getJSXElementRegistry(
  //   babelTrees: Tree<JSXElementTree>[],
  //   filename: string,
  //   platform: string,
  // ) {
  //   return Stream.fromIterable(babelTrees).pipe(
  //     Stream.map((x) => extractSheetsFromTree(x, filename, platform)),
  //     Stream.map(HashMap.fromIterable),
  //     Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) =>
  //       HashMap.union(current, prev),
  //     ),
  //   );
  // }
});

export class BabelCompiler extends Context.Tag('babel/common/compiler')<
  BabelCompiler,
  {
    readonly getCompilerInputCode: (
      input: BabelFileEntry | BabelCodeEntry,
    ) => Effect.Effect<string, PlatformError, never>;
    transformAST: (
      registry: HashMap.HashMap<string, JSXElementNode>,
      platform: string,
    ) => Effect.Effect<HashMap.HashMap<string, TransformedJSXElementTree>>;
    readonly mutateAST: (
      ast: ParseResult<t.File>,
    ) => Effect.Effect<GeneratorResult | null, never, never>;
    readonly getBabelOutput: (
      input: BabelFileEntry | BabelCodeEntry,
    ) => Effect.Effect<BabelOutput, PlatformError, never>;

    readonly memberExpressionIsReactImport: (
      path: NodePath<t.MemberExpression>,
    ) => boolean;

    readonly identifierIsReactImport: (path: NodePath<t.Identifier>) => boolean;
  }
>() {
  static Live = Layer.scoped(BabelCompiler, make).pipe(
    Layer.provide(Layer.merge(NodeFileSystem.layer, Path.layer)),
  );
}

const streamJsxElementTrees = (ast: ParseResult<t.File>, filename: string) =>
  Stream.async<NodePath<t.JSXElement>>((emit) => {
    // const cssImports: string[] = [];
    traverse(ast, {
      Program: {
        exit() {
          emit.end();
        },
      },
      JSXElement(path) {
        emit.single(path);
        path.skip();
      },
    });
  }).pipe(
    Stream.map((parentPath) => {
      const uid = parentPath.scope.generateUidIdentifier();
      // console.log('UID: ', uid.name, uidUnNamed.name);
      Hash.array([Hash.string(filename + uid.name)]);
      const hash = pipe(
        Hash.combine(Hash.string(filename + uid.name)),
        apply(
          getJSXElementName(parentPath.node.openingElement).pipe(
            Option.map((x) => Hash.string(x)),
            Option.getOrElse(() => Hash.string('unknown')),
          ),
        ),
      );
      const elementTree = JSXElementTree({
        order: -1,
        babelNode: parentPath.node,
        uid: `${hash}:0`,
        source: getJSXElementSource(parentPath),
        cssImports: [],
        parentID: null,
      });
      const parentTree = new Tree<JSXElementTree>(elementTree);
      gelBabelJSXElementChildLeaves(parentPath, parentTree.root);
      return parentTree;
    }),
    Stream.runCollect,
    Effect.map((x) => RA.fromIterable(x)),
  );

const gelBabelJSXElementChildLeaves = (
  path: JSXElementNodePath,
  parent: TreeNode<JSXElementTree>,
) => {
  const childs = pipe(
    path.get('children'),
    RA.filterMap(Option.liftPredicate(babelPredicates.isJSXElementPath)),
  );

  for (const childPath of childs) {
    const order = parent.childrenCount;
    // const childUid = path.scope.generateUid();
    // console.log('CHILD_UID: ', childUid);
    const childLeave = parent.addChild(
      JSXElementTree({
        order,
        babelNode: childPath.node,
        uid: `${parent.value.uid}:${order}`,
        source: getJSXElementSource(childPath),
        cssImports: parent.value.cssImports,
        parentID: parent.value.uid,
      }),
    );
    childLeave.parent = parent;
    gelBabelJSXElementChildLeaves(childPath, childLeave);
  }
};

const extractLanguageRegions = (
  code: string,
  config: {
    functions: string[];
    jsxAttributes: string[];
  },
): t.SourceLocation[] => {
  const sourceLocations: t.SourceLocation[] = [];
  try {
    const parsed = getBabelAST(code, 'any_file');

    traverse(parsed, {
      CallExpression: (path) => {
        const sources: t.SourceLocation[] = [];
        if (
          t.isIdentifier(path.node.callee) &&
          config.functions.includes(path.node.callee.name)
        ) {
          for (const arg of path.node.arguments) {
            if (t.isObjectExpression(arg)) {
              sources.push(...matchVariantsObject(arg.properties));
            }
          }
        }
        sourceLocations.push(...sources);
      },
      TaggedTemplateExpression: (path) => {
        if (
          t.isIdentifier(path.node.tag) &&
          config.functions.includes(path.node.tag.name)
        ) {
          sourceLocations.push(...templateExpressionMatcher(path.node.quasi.quasis));
        }
      },
      JSXAttribute: (path) => {
        if (
          t.isJSXIdentifier(path.node.name) &&
          config.jsxAttributes.includes(path.node.name.name) &&
          path.node.value
        ) {
          if (t.isStringLiteral(path.node.value) && path.node.value.loc) {
            sourceLocations.push(path.node.value.loc);
          }
          if (
            t.isJSXExpressionContainer(path.node.value) &&
            t.isTemplateLiteral(path.node.value.expression)
          ) {
            sourceLocations.push(
              ...templateExpressionMatcher(path.node.value.expression.quasis),
            );
          }
        }
      },
    });

    return sourceLocations;
  } catch {
    return sourceLocations;
  }
};

const matchVariantsObject = (
  properties: t.ObjectExpression['properties'],
  results: t.SourceLocation[] = [],
): t.SourceLocation[] => {
  const nextProperty = properties.shift();
  if (!nextProperty) return results;

  if (t.isObjectProperty(nextProperty)) {
    if (t.isStringLiteral(nextProperty.value) && nextProperty.value.loc) {
      results.push(nextProperty.value.loc);
    }
    if (t.isTemplateLiteral(nextProperty.value)) {
      results.push(...templateExpressionMatcher(nextProperty.value.quasis, results));
    }

    if (babelPredicates.isObjectExpression(nextProperty.value)) {
      return matchVariantsObject(nextProperty.value.properties, results);
    }
  }

  return matchVariantsObject(properties, results);
};

const templateExpressionMatcher = (
  node: t.TemplateElement[],
  results: t.SourceLocation[] = [],
): t.SourceLocation[] => {
  const nextToken = node.shift();
  if (!nextToken) return results;

  if (nextToken.loc) {
    results.push(nextToken.loc);
  }

  return templateExpressionMatcher(node, results);
};

const transformTrees = (
  registry: HashMap.HashMap<string, JSXElementNode>,
  platform: string,
) =>
  Effect.gen(function* () {
    if (platform === 'web') {
      return HashMap.empty<string, TransformedJSXElementTree>();
    }
    return transformJSXElementTree(registry);
  });

const getJSXCompiledTreeRuntime = (
  leave: JSXElementNode,
  parentLeave: Option.Option<JSXElementNode>,
) =>
  parentLeave.pipe(
    Option.map((parent) =>
      applyParentEntries(
        leave.entries,
        parent.childEntries,
        leave.order,
        leave.parentSize,
      ),
    ),
    Option.getOrElse(() => leave.entries),
  );

const transformJSXElementTree = (trees: HashMap.HashMap<string, JSXElementNode>) => {
  return HashMap.map(trees, (node): TransformedJSXElementTree => {
    const runtimeSheets = getJSXCompiledTreeRuntime(
      node,
      Option.flatMap(node.parentID, (x) => HashMap.get(trees, x)),
    );
    const runtimeAST = Option.fromNullable(
      addTwinPropsToElement(node, runtimeSheets, {
        componentID: true,
        order: true,
        styledProps: true,
        templateStyles: true,
      }),
    );
    return { leave: node, runtimeSheets, runtimeAST };
  });
};
