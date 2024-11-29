// import * as Array from 'effect/Array';
// import * as Chunk from 'effect/Chunk';
// import * as Effect from 'effect/Effect';
// import * as Option from 'effect/Option';
// import * as Stream from 'effect/Stream';
// import path from 'path';
// import * as vscode from 'vscode';
// import {
//   ConfigManagerService,
//   NativeTwinManagerService,
// } from '@native-twin/language-service';
// import { VscodeContext } from '../extension/extension.service.js';
// import { listenStreamEvent, thenable } from '../extension/extension.utils.js';
// import { TwinTextDocument } from '../language/models/TwinTextDocument.model.js';

// const getValidFiles = Effect.flatMap(NativeTwinManagerService, (twin) => {
//   return Stream.fromIterable(twin.tw.config.content).pipe(
//     Stream.mapEffect((x) => thenable(() => vscode.workspace.findFiles(path.join(x)))),
//     Stream.flattenIterables,
//     Stream.filter((uri) => twin.isAllowedPath(uri.path)),
//     Stream.runCollect,
//     Effect.map(Chunk.toArray),
//   );
// });

// export const TwinFileSystemLive = Effect.gen(function* () {
//   const twin = yield* NativeTwinManagerService;
//   const ctx = yield* VscodeContext;

//   const validTextFiles = yield* getValidFiles;

//   const watcher = vscode.workspace.createFileSystemWatcher('**/*');
//   ctx.subscriptions.push(watcher);
//   yield* listenStreamEvent(watcher.onDidChange).pipe(
//     Stream.filter((uri) => twin.isAllowedPath(uri.path)),
//     Stream.mapEffect((uri) => getTextDocumentByUri(uri)),
//     Stream.runCollect,
//   );

//   return {
//     validTextFiles,
//     watcher,
//   };
// });

// const getTextDocumentByUri = (uri: vscode.Uri) =>
//   Effect.acquireRelease(
//     Effect.gen(function* () {
//       const config = yield* ConfigManagerService;
//       const vsDocument = Array.findFirst(
//         vscode.workspace.textDocuments,
//         (x) => x.uri.toString() === uri.toString(),
//       ).pipe(Option.getOrThrow);
//       const twinDocument = new TwinTextDocument(vsDocument);

//       const languageRanges = Array.map(
//         twinDocument.getLanguageRegions(config.config),
//         (location) => {
//           return twinDocument.babelLocationToVscode(location);
//         },
//       );

//       return {
//         languageRanges,
//         twinDocument,
//       };
//     }),
//     (result, _exit) => Effect.succeed(result),
//   );
