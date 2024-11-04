import * as Array from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import path from 'path';
import * as vscode from 'vscode';
import {
  NativeTwinManagerService,
  NativeTwinPluginConfiguration,
} from '@native-twin/language-service';
import { VscodeContext } from '../extension/extension.service';
import { thenable } from '../extension/extension.utils';
import { TwinTextDocument } from '../language/models/TwinTextDocument.model';

export class TreeTextDocumentNode {
  readonly _tag = 'TreeTextDocumentNode';
  constructor(
    readonly twinDocument: TwinTextDocument,
    readonly config: NativeTwinPluginConfiguration,
  ) {}

  get name() {
    return path.posix.basename(this.twinDocument.document.uri.path);
  }

  get document() {
    return this.twinDocument.document;
  }

  get styles() {
    return this.twinDocument
      .getLanguageRegions(this.config)
      .map((x) => this.twinDocument.babelLocationToVscode(x));
  }
}

// type TreeNode = TreeTextDocumentNode;

// export const VscodeTreeFSProviderLive = treeDataProvider<TreeTextDocumentNode>(
//   'nativeTwin-files',
// )((refresh) =>
//   Effect.gen(function* () {
//     const rootNodes: Array<TreeTextDocumentNode> = [];
//     const nodes = new Map<string, TreeTextDocumentNode>();
//     const { get: getConfig } = yield* extensionConfigState(
//       Constants.DEFAULT_PLUGIN_CONFIG,
//     );
//     const twin = yield* NativeTwinManagerService;
//     const { watcher } = yield* getVscodeFS;

//     const reset = Effect.suspend(() => {
//       rootNodes.length = 0;
//       nodes.clear();
//       return refresh(Option.none());
//     });

//     yield* registerCommand('nativeTwin.resetTwinFS', () => reset);

//     yield* listenStreamEvent(watcher.onDidChange).pipe(
//       Stream.filterEffect((uri) => twin.isAllowedPath(uri.path)),
//       Stream.mapEffect((uri) =>
//         Effect.flatMap(getConfig, (config) => getTextDocumentByUri(uri, config)),
//       ),
//       Stream.runForEach((file) => {
//         return Effect.suspend(() => {
//           return getConfig.pipe(
//             Effect.andThen((x) => {
//               const added = addNode(new TreeTextDocumentNode(file.twinDocument, x));
//               console.log('ADDED: ', added);
//               return refresh(Option.some(added[0]));
//             }),
//           );
//         });
//       }),
//       Effect.forkScoped,
//     );

//     function addNode(
//       file: TreeTextDocumentNode,
//     ): [TreeTextDocumentNode, TreeTextDocumentNode | undefined, boolean] {
//       let node = nodes.get(file.name);

//       if (node === undefined) {
//         node = file;
//         nodes.set(file.name, node);
//         rootNodes.unshift(node);
//       }

//       return [node, node, false];
//     }

//     return TreeDataProvider<TreeTextDocumentNode>({
//       children: Option.match({
//         onNone: () => Effect.succeedSome(rootNodes),
//         onSome: (node) => Effect.succeed(children(nodes, node)),
//       }),
//       treeItem: (node) => Effect.succeed(treeItem(node)),
//     });
//   }),
// ).pipe(Layer.provide(NativeTwinManagerService.Live));

export const getVscodeFS = Effect.gen(function* () {
  const ctx = yield* VscodeContext;

  const validTextFiles = yield* getValidFiles;

  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  ctx.subscriptions.push(watcher);

  return {
    validTextFiles,
    watcher,
  };
});

export const getTextDocumentByUri = (
  uri: vscode.Uri,
  config: NativeTwinPluginConfiguration,
) =>
  Effect.gen(function* () {
    const vsDocument = Array.findFirst(
      vscode.workspace.textDocuments,
      (x) => x.uri.toString() === uri.toString(),
    ).pipe(Option.getOrThrow);
    const twinDocument = new TwinTextDocument(vsDocument);

    const languageRanges = Array.map(
      twinDocument.getLanguageRegions(config),
      (location) => {
        return twinDocument.babelLocationToVscode(location);
      },
    );

    return {
      languageRanges,
      twinDocument,
    };
  });

const getValidFiles = Effect.flatMap(NativeTwinManagerService, (twin) => {
  return Stream.fromIterable(twin.tw.config.content).pipe(
    Stream.mapEffect((x) => thenable(() => vscode.workspace.findFiles(path.join(x)))),
    Stream.flattenIterables,
    Stream.filter((uri) => twin.isAllowedPath(uri.path)),
    Stream.runCollect,
    Effect.map(Chunk.toArray),
  );
});

// const children = (
//   nodes: Map<string, TreeNode>,
//   node: TreeNode,
// ): Option.Option<Array<TreeNode>> => {
//   switch (node._tag) {
//     case 'TreeTextDocumentNode': {
//       const nodes: Array<TreeNode> = [
//         new TreeTextDocumentNode(node.twinDocument, node.config),
//         new TreeTextDocumentNode(node.twinDocument, node.config),
//       ];

//       // node.attributes.forEach((value, key) => {
//       //   nodes.push(new InfoNode(key, Inspectable.toStringUnknown(value)));
//       // });

//       // if (node.events.hasEvents) {
//       //   nodes.push(node.events);
//       // }

//       // if (node.children.length > 0) {
//       //   nodes.push(new ChildrenNode(node.children));
//       // }

//       return Option.some(nodes);
//     }
//   }
// };

// const treeItem = (node: TreeNode): vscode.TreeItem => {
//   switch (node._tag) {
//     case 'TreeTextDocumentNode': {
//       const item = new vscode.TreeItem(
//         path.basename(node.twinDocument.document.uri.path),
//         vscode.TreeItemCollapsibleState.Collapsed,
//       );
//       item.id = node.twinDocument.document.uri.toString();
//       item.description = node.twinDocument.document.uri.toString();
//       return item;
//     }
//   }
// };
