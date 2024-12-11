import type * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import type { Position, Range, TextDocument } from 'vscode-languageserver-textdocument';
import { JSXElementNode } from '../../models/JSXElement.model.js';
import { TwinNodeContext } from '../../services/TwinNodeContext.service.js';
import { getElementEntries } from '../../utils/babel/babel.jsx.js';
import { FsUtils, FsUtilsLive } from '../fs.utils.js';
import { TwinFileDocument } from './TwinDocument.model.js';

const quotesRegex = /^['"`].*['"`]$/g;

export const make = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const fs = yield* FsUtils;
  const twinDocuments = ctx.projectFilesRef.changes.pipe(
    Stream.flattenIterables,
    Stream.mapEffect((path) => createDocumentByPath(path)),
  );

  return {
    twinDocuments,
    babelLocationToRange,
    createDocument,
    createDocumentByPath,
    compileDocument,
  };

  function compileDocument(document: TwinFileDocument, platform: string) {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* ctx.getTwinRuntime(platform);
      const { ast, mappedElements } = yield* document.JSXElementNodes;
      const jsxElements = Chunk.map(
        mappedElements,
        (element) =>
          new JSXElementNode({
            leave: element.node,
            order: element.node.value.order,
            filename: document.uri,
            runtimeData: element.runtimeData,
            entries: getElementEntries(
              RA.fromIterable(element.runtimeData),
              tw,
              compilerContext,
            ),
          }),
      ).pipe(RA.fromIterable);

      return {
        jsxElements,
        ast,
      };
    });
  }

  function createDocument(path: string, content: string) {
    return Effect.sync(() => new TwinFileDocument(path, content));
  }

  function createDocumentByPath(path: string) {
    return fs.readFile(path).pipe(Effect.flatMap((x) => createDocument(path, x)));
  }

  function babelLocationToRange(
    location: t.SourceLocation,
    document: TextDocument,
  ): Range {
    const startPosition: Position = {
      line: location.start.line,
      character: location.start.column,
    };
    const endPosition: Position = {
      line: location.end.line,
      character: location.end.column,
    };

    const range: Range = {
      start: startPosition,
      end: endPosition,
    };
    const text = document.getText(range);

    if (quotesRegex.test(text)) {
      range.start.character += 1;
      range.end.character -= 1;
      return { ...range };
    }
    return range;
  }
});

export interface TwinDocumentsContext extends Effect.Effect.Success<typeof make> {}
export const TwinDocumentsContext =
  Context.GenericTag<TwinDocumentsContext>('compiler/files');

export const TwinDocumentsContextLive = Layer.scoped(TwinDocumentsContext, make).pipe(
  Layer.provide(TwinNodeContext.Live),
  Layer.provide(FsUtilsLive),
);
