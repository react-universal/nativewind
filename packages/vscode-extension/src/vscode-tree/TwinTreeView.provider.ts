import { Stream } from 'effect';
import * as Array from 'effect/Array';
import * as Effect from 'effect/Effect';
import { identity, pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as vscode from 'vscode';
import {
  JSXElementNode,
  compileReactCode,
  BuildConfig,
  makeBabelLayer,
} from '@native-twin/compiler/babel';
import { NativeTwinServiceNode } from '@native-twin/compiler/node';
import { Constants, NativeTwinManagerService } from '@native-twin/language-service';
import { VscodeContext } from '../extension/extension.service';
import { extensionConfigState, listenForkEvent } from '../extension/extension.utils';
import { TwinTextDocument } from '../language/models/TwinTextDocument.model';
import { TreeDataProvider } from './VscodeTree.models';
import { treeDataProvider } from './VscodeTree.provider';
import { getTextDocumentByUri, getVscodeFS } from './VscodeTreeFS.provider';

class TreeJSXElementNode implements vscode.TreeItem {
  readonly element: JSXElementNode;
  id: string | undefined;
  label: string;
  private _childs: TreeJSXElementNode[] = [];

  constructor(element: JSXElementNode) {
    this.id = element.id;
    this.label = element.filename;
    this.element = element;
  }

  get childs() {
    return pipe(
      this._childs,
      Array.filterMap((node) => {
        return Option.map(node.element.parentID, (self) => {
          if (self === this.element.id) return Option.some(node);
          return Option.none();
        }).pipe(Option.flatten);
      }),
    );
  }

  get isRoot() {
    return Option.isNone(this.element.parentID);
  }

  addChild(child: JSXElementNode) {
    this._childs.push(new TreeJSXElementNode(child));
  }
}

type VscodeTreeNode = TreeJSXElementNode;

export const TwinTreeDataFilesProvider = treeDataProvider<VscodeTreeNode>(
  'nativeTwin-files',
)((refresh) => {
  return Effect.gen(function* () {
    const rootNodes: VscodeTreeNode[] = [];
    const allNodes = new Map<string, VscodeTreeNode>();

    const twin = yield* NativeTwinManagerService;
    const settings = yield* extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG);

    const workspaceRoot = pipe(
      Array.ensure(vscode.workspace.workspaceFolders),
      Array.flatMapNullable(identity),
      Array.head,
      Option.getOrUndefined,
    );

    const { watcher, validTextFiles } = yield* getVscodeFS;

    yield* listenForkEvent(watcher.onDidChange, (uri) => addFile(uri));

    yield* Stream.fromIterable(validTextFiles).pipe(
      Stream.runForEach((x) => Effect.suspend(() => addFile(x))),
    );

    const addFile = (uri: vscode.Uri) =>
      Effect.gen(function* () {
        const config = yield* settings.get;
        const { twinDocument } = yield* getTextDocumentByUri(uri, config);
        const registry = yield* getCompiledCode(
          twinDocument,
          Option.getOrElse(
            Option.fromNullable(workspaceRoot?.uri.fsPath),
            () => vscode.env.appHost,
          ),
          twin.configFile,
        );

        HashMap.forEach(registry.registry, (node) => {
          let currentNode = allNodes.get(node.id);
          const isRootNode = Option.isNone(node.parentLeave);
          if (!currentNode) {
            if (isRootNode) {
              const index = rootNodes.findIndex((x) => x.id === node.id);
              if (index) {
                rootNodes.splice(index, 1);
              }
            }
            currentNode = new TreeJSXElementNode(node);
            allNodes.set(currentNode.element.id, currentNode);

            if (isRootNode) {
              rootNodes.unshift(currentNode);
            }
          }

          if (isRootNode) {
            rootNodes.push(currentNode);
          }
        });
        yield* refresh(Option.none());
      });

    return TreeDataProvider<VscodeTreeNode>({
      children: Option.match({
        onNone: () => Effect.succeedSome(rootNodes),
        onSome: (node) => Effect.succeed(Option.some(node.childs)),
      }),
      treeItem(element) {
        return Effect.succeed(
          new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Collapsed),
        );
      },
    });
  });
});

export const TwinTreeViewProviderLive = Effect.gen(function* () {
  const ctx = yield* VscodeContext;
  const rootNodes: VscodeTreeNode[] = [];
  const allNodes = new Map<string, VscodeTreeNode>();

  const twin = yield* NativeTwinManagerService;
  const settings = yield* extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG);
  const onDidChangeTreeData = new vscode.EventEmitter<
    VscodeTreeNode | undefined | void
  >();

  const workspaceRoot = pipe(
    Array.ensure(vscode.workspace.workspaceFolders),
    Array.flatMapNullable(identity),
    Array.head,
    Option.getOrUndefined,
  );

  if (!workspaceRoot) return;

  const { watcher, validTextFiles } = yield* getVscodeFS;

  yield* listenForkEvent(watcher.onDidChange, (uri) =>
    addFile(uri).pipe(Effect.andThen(() => onDidChangeTreeData.fire())),
  );

  yield* Stream.fromIterable(validTextFiles).pipe(
    Stream.runForEach((x) => Effect.suspend(() => addFile(x))),
  );

  const addFile = (uri: vscode.Uri) =>
    Effect.gen(function* () {
      const config = yield* settings.get;
      const { twinDocument } = yield* getTextDocumentByUri(uri, config);
      const registry = yield* getCompiledCode(
        twinDocument,
        workspaceRoot.uri.fsPath,
        twin.configFile,
      );

      HashMap.forEach(registry.registry, (node) => {
        let currentNode = allNodes.get(node.id);
        const isRootNode = Option.isNone(node.parentLeave);
        if (!currentNode) {
          if (isRootNode) {
            const index = rootNodes.findIndex((x) => x.id === node.id);
            if (index) {
              rootNodes.splice(index, 1);
            }
          }
          currentNode = new TreeJSXElementNode(node);
          allNodes.set(currentNode.element.id, currentNode);

          if (isRootNode) {
            rootNodes.unshift(currentNode);
          }
        }

        if (isRootNode) {
          rootNodes.push(currentNode);
        }
        onDidChangeTreeData.fire(currentNode);
      });
    });

  const treeProvider: vscode.TreeDataProvider<VscodeTreeNode> = {
    onDidChangeTreeData: onDidChangeTreeData.event,
    getChildren(element): vscode.ProviderResult<VscodeTreeNode[]> {
      if (!element) return [];

      return element.childs;
      // return HashMap.fromIterable(allNodes).pipe(
      //   HashMap.filterMap((node) => {
      //     return Option.zipWith(
      //       element.element.parentID,
      //       node.element.parentID,
      //       (self, that) => {
      //         if (self === that) return Option.some(node);
      //         return Option.none();
      //       },
      //     ).pipe(Option.flatten);
      //   }),
      //   HashMap.values,
      //   Array.fromIterable,
      // );
    },
    getTreeItem(item): Promise<vscode.TreeItem> {
      return Promise.resolve({
        id: item.id,
        label: item.element.filename,
        // resourceUri: vscode.Uri.file(item.filename),
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      });
    },
    getParent(item) {
      return HashMap.fromIterable(allNodes).pipe(
        HashMap.findFirst((node) => {
          if (item.element.parentID._tag === 'None') return false;
          return item.element.parentID.value === node.id;
        }),
        Option.map((x) => x[1]),
        Option.getOrUndefined,
      );
    },
    resolveTreeItem(_item, _element, _token) {
      return _item;
    },
  };

  ctx.subscriptions.push(
    vscode.window.registerTreeDataProvider('nativeTwin-files', treeProvider),
  );
}).pipe(Layer.scopedDiscard);

const getCompiledCode = (
  twinDocument: TwinTextDocument,
  root: string,
  configFilePath: string,
) =>
  compileReactCode.pipe(
    Effect.provideService(BuildConfig, {
      code: twinDocument.document.getText(),
      filename: twinDocument.document.fileName,
      inputCSS: '',
      outputCSS: '',
      platform: 'ios',
      projectRoot: root,
      twinConfigPath: configFilePath,
    }),
    Effect.scoped,
    Effect.provide(makeBabelLayer),
    Effect.provide(NativeTwinServiceNode.Live(configFilePath, root, 'ios')),
  );
