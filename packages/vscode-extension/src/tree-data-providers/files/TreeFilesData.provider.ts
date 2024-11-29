import * as vscode from 'vscode';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import { identity, pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import { Constants, NativeTwinPluginConfiguration } from '@native-twin/language-service';
import {
  extensionConfigState,
  listenForkEvent,
  registerCommand,
} from '../../extension/extension.utils.js';
import { getTwinTextDocumentByUri, getVscodeFS } from '../../file-system/index.js';
import { TwinTextDocument } from '../../language/index.js';
import { TreeDataProvider } from '../models/index.js';
import { getTwinDocumentID, makeTreeDataProvider } from '../tree.utils.js';
import {
  TwinFileTreeNode,
  AnyTreeDataNode,
  FileTwinRegionTreeNode,
} from './TreeFileData.model.js';

class FileNodesManager {
  // private _nodes: AnyTreeDataNode[] = [];
  private _rootNodes: TwinFileTreeNode[] = [];
  private _storedNodes = new Map<string, TwinFileTreeNode>();
  constructor(readonly workspaceRoot: vscode.Uri) {}

  get storedFiles() {
    return this._storedNodes;
  }

  get rootNodes() {
    return this._rootNodes;
  }

  getOrSetStoredFile(doc: TwinTextDocument) {
    const id = getTwinDocumentID(doc);
    const node = this._storedNodes.get(id);
    if (!node) {
      const newNode = new TwinFileTreeNode(this.workspaceRoot.path, doc);
      this._storedNodes.set(id, newNode);
      this._rootNodes.unshift(newNode);

      return newNode;
    }

    const index = this.getFileNodeIndex(doc);

    if (index) {
      this._rootNodes.splice(index, 1);
      this._rootNodes.unshift(node);
    }
    return node;
  }

  addFileNode(id: string, twinDoc: TwinTextDocument) {
    this._storedNodes.set(id, new TwinFileTreeNode(this.workspaceRoot.path, twinDoc));
  }

  private getFileNodeIndex(doc: TwinTextDocument) {
    const id = getTwinDocumentID(doc);
    return this._rootNodes.findIndex((x) => x.id === id);
  }
}

export const TwinTreeDataFilesProvider = makeTreeDataProvider<AnyTreeDataNode>(
  'nativeTwin-files',
)((refresh) => {
  return Effect.gen(function* () {
    const settings = yield* extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG);

    const workspaceRoot = pipe(
      Array.ensure(vscode.workspace.workspaceFolders),
      Array.flatMapNullable(identity),
      Array.head,
      Option.getOrThrow,
    );

    const manager = new FileNodesManager(workspaceRoot.uri);

    yield* registerCommand(
      'nativeTwin.openTwinRegion',
      (region: FileTwinRegionTreeNode) => {
        console.log('FIRE: ', region);
        return region.onClick();
      },
    );

    const { watcher, validTextFiles } = yield* getVscodeFS;

    yield* listenForkEvent(watcher.onDidChange, (uri) => addFile(uri));

    yield* Stream.fromIterable(validTextFiles).pipe(
      Stream.runForEach((x) => Effect.suspend(() => addFile(x))),
    );

    const addFile = (uri: vscode.Uri) =>
      Effect.gen(function* () {
        const config = yield* settings.get;
        const { twinDocument } = getTwinTextDocumentByUri(uri, config);
        manager.getOrSetStoredFile(twinDocument);

        yield* refresh(Option.none());
      });

    return TreeDataProvider<AnyTreeDataNode>({
      children: Option.match({
        onNone: () => Effect.succeedSome(manager.rootNodes),
        onSome: (node) => {
          return settings.get.pipe(Effect.map((x) => children(node, x)));
        },
      }),
      treeItem: (element) => Effect.succeed(treeItem(element)),
    });
  });
});

const treeItem = (node: AnyTreeDataNode) => {
  switch (node._tag) {
    case 'FileTreeNode':
      const fileNode = new vscode.TreeItem(
        node.label,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      fileNode.resourceUri = node.document.uri;
      fileNode.iconPath = vscode.ThemeIcon.File;
      fileNode.id = node.id;
      return fileNode;
    case 'FileTwinRegionTreeNode':
      const regionNode = new vscode.TreeItem(
        'JSX Region',
        vscode.TreeItemCollapsibleState.None,
      );
      regionNode.description = `from: ${node.region.offset.start} to: ${node.region.offset.end}`;
      regionNode.contextValue = 'twinRegion';
      regionNode.iconPath = 'public-ports-view-icon';
      regionNode.resourceUri = node.parent.document.uri;
      regionNode.tooltip = 'Show Twin Region';
      regionNode.command = {
        title: 'Show Twin Region',
        command: 'nativeTwin.openTwinRegion',
        arguments: [node],
        tooltip: 'Show Twin Region',
      };

      regionNode.id = node.id;
      return regionNode;
  }
};

const children = (
  node: AnyTreeDataNode,
  config: NativeTwinPluginConfiguration,
): Option.Option<Array<AnyTreeDataNode>> => {
  switch (node._tag) {
    case 'FileTreeNode':
      const regions = node.getChilds(config);
      return Option.some(regions);
    case 'FileTwinRegionTreeNode':
      return Option.none();
  }
};
// const registry = yield* getCompiledCode(
//   twinDocument,
//   workspaceRoot.uri.fsPath,
//   twin.configFile,
// );

// HashMap.forEach(registry.registry, (node) => {
//   let currentNode = allNodes.get(node.id);
//   const isRootNode = Option.isNone(node.parentLeave);
//   if (!currentNode) {
//     if (isRootNode) {
//       const index = rootNodes.findIndex((x) => x.id === node.id);
//       if (index) {
//         rootNodes.splice(index, 1);
//       }
//     }
//     currentNode = new TwinFileTreeNode(node);
//     allNodes.set(currentNode.twinDocument.id, currentNode);

//     if (isRootNode) {
//       rootNodes.unshift(currentNode);
//     }
//   }

//   if (isRootNode) {
//     rootNodes.push(currentNode);
//   }
// });
