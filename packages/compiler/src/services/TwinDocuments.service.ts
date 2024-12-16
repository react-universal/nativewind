import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import { FSUtils, TwinPath } from '../internal/fs';
import { JSXElementNode } from '../models/JSXElement.model.js';
import { TwinFileDocument } from '../models/TwinDocument.model.js';
import { getElementEntries } from '../utils/babel/babel.jsx.js';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service.js';

export const make = Effect.gen(function* () {
  const { getTwinRuntime } = yield* TwinNodeContext;
  const fs = yield* FSUtils.FsUtils;

  return {
    createDocument,
    createDocumentByPath,
    getDocumentNodes,
    compileManyDocuments,
  };

  function compileManyDocuments(documents: Iterable<TwinFileDocument>, platform: string) {
    return Stream.fromIterable(documents).pipe(
      Stream.mapEffect((document) =>
        getDocumentNodes(document, platform).pipe(
          Effect.map((jsxElements) => jsxElements),
        ),
      ),
      Stream.flattenIterables,
      Stream.run(
        Sink.collectAllToMap(
          (document) => document.filename,
          (document) => document,
        ),
      ),
    );
  }

  function getDocumentNodes(document: TwinFileDocument, platform: string) {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* getTwinRuntime(platform);
      const mappedElements = yield* document.mappedAttributes;
      const jsxElements = HashSet.map(
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
      );

      return jsxElements;
    });
  }

  function createDocument(path: TwinPath.AbsoluteFilePath, content: string) {
    return Effect.sync(() => new TwinFileDocument(path, content));
  }

  function createDocumentByPath(path: TwinPath.AbsoluteFilePath) {
    return fs.readFile(path).pipe(Effect.flatMap((text) => createDocument(path, text)));
  }
});

export interface TwinDocumentsContext extends Effect.Effect.Success<typeof make> {}
export const TwinDocumentsContext =
  Context.GenericTag<TwinDocumentsContext>('compiler/files');

export const TwinDocumentsContextLive = Layer.scoped(TwinDocumentsContext, make).pipe(
  Layer.provide(TwinNodeContextLive),
  Layer.provide(FSUtils.FsUtilsLive),
  Layer.provide(TwinPath.TwinPathLive),
);
