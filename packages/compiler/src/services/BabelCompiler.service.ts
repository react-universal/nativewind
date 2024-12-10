import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { Chunk } from 'effect';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import { CompilerContext, RuntimeComponentEntry } from '@native-twin/css/jsx';
import { Tree } from '@native-twin/helpers/tree';
import {
  NodeWithMappedAttributes,
  TwinFileDocument,
} from '../internal/TwinDocument/TwinDocument.model.js';
import { FsUtils, FsUtilsLive } from '../internal/fs.utils.js';
import { JSXElementTree } from '../models/Babel.models.js';
import { JSXElementNode } from '../models/JSXElement.model.js';
import { InternalTwFn } from '../models/twin.types.js';
import {
  getElementEntries,
  getJSXCompiledTreeRuntime,
} from '../utils/babel/babel.jsx.js';
import { streamJsxElementTrees, transformTrees } from '../utils/babel/babel.transform.js';
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
export interface BabelCodeEntry extends BaseEntry {
  readonly _tag: 'BabelCodeEntry';
  readonly code: string;
  readonly platform: string;
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
  extractedAttributes: NodeWithMappedAttributes,
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
  const fs = yield* FsUtils;

  const compileTwinDocument = (twinFile: TwinFileDocument, platform: string) => {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* ctx.getTwinRuntime(platform);
      const { mappedElements } = yield* twinFile.JSXElementNodes;
      return Chunk.map(mappedElements, (element) => {
        return makeJSXElementNode(
          twinFile.uri,
          element,
          getElementEntries(RA.fromIterable(element.runtimeData), tw, compilerContext),
        );
      }).pipe(RA.fromIterable);
    });
  };

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
          // Stream.tap((x) => Effect.logInfo('EXTRACTED_ATTRIBUTES: ', x.node)),
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
    memberExpressionIsReactImport,
    identifierIsReactImport,
    compileTwinDocument,
    mutateAST: (ast: ParseResult<t.File>) =>
      Effect.sync(() => {
        const generate = new CodeGenerator(ast);
        return Option.fromNullable(generate.generate()).pipe(Option.getOrNull);
      }),
  };

  function getCompilerInputCode(input: BabelFileEntry | BabelCodeEntry) {
    return Effect.gen(function* () {
      switch (input._tag) {
        case 'BabelCodeEntry':
          return input.code;
        case 'BabelFileEntry':
          return yield* fs.readFile(input.filename);
      }
    });
  }

  function mappedAttributes(tree: Tree<JSXElementTree>) {
    return Stream.async<NodeWithMappedAttributes>((emit) => {
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
});

export interface BabelCompilerContext extends Effect.Effect.Success<typeof make> {}
export const BabelCompilerContext = Context.GenericTag<BabelCompilerContext>(
  'babel/common/compiler',
);

export const BabelCompilerContextLive = Layer.effect(BabelCompilerContext, make).pipe(
  Layer.provide(TwinNodeContext.Live),
  Layer.provide(FsUtilsLive),
);
