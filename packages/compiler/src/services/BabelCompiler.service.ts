import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { JSXElementNode } from '../models/JSXElement.model.js';
import type {
  NodeWithMappedAttributes,
  TwinFileDocument,
} from '../models/TwinDocument.model.js';
import {
  getElementEntries,
  getJSXCompiledTreeRuntime,
} from '../utils/babel/babel.jsx.js';
import { streamJsxElementTrees, transformTrees } from '../utils/babel/babel.transform.js';
import {
  identifierIsReactImport,
  memberExpressionIsReactImport,
} from '../utils/babel/babel.utils.js';
import { TwinDocumentsContextLive } from './TwinDocuments.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

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

  const compileTwinDocument = (twinFile: TwinFileDocument, platform: string) => {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* ctx.getTwinRuntime(platform);
      const mappedElements = yield* twinFile.mappedAttributes;
      return {
        nodes: HashSet.map(mappedElements, (element) => {
          return makeJSXElementNode(
            twinFile.uri,
            element,
            getElementEntries(RA.fromIterable(element.runtimeData), tw, compilerContext),
          );
        }).pipe(RA.fromIterable),
        ast: twinFile.ast,
      };
    });
  };

  return {
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
});

export interface BabelCompilerContext extends Effect.Effect.Success<typeof make> {}
export const BabelCompilerContext = Context.GenericTag<BabelCompilerContext>(
  'babel/common/compiler',
);

export const BabelCompilerContextLive = Layer.effect(BabelCompilerContext, make).pipe(
  Layer.provide(TwinNodeContext.Live),
  Layer.provide(TwinDocumentsContextLive),
);
