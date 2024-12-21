import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { FSUtils, type TwinPath } from '../internal/fs';
import { TwinFileDocument } from '../models/TwinDocument.model.js';

export const make = Effect.gen(function* () {
  const fs = yield* FSUtils.FsUtils;

  return {
    createDocument,
    createDocumentByPath,
  };

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
  Layer.provide(FSUtils.FsUtilsLive),
);
