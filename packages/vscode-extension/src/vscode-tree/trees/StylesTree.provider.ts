import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as ScopedRef from 'effect/ScopedRef';
import * as vscode from 'vscode';
import { NativeTwinManagerService } from '@native-twin/language-service';
import { TreeDataProvider } from '../VscodeTree.models';
import { treeDataProvider } from '../VscodeTree.provider';

class TreeInfoNode {
  readonly _tag = 'TreeInfoNode';
  constructor(
    readonly key: string,
    readonly value: string,
  ) {}
}

type VscodeTreeNode = TreeInfoNode;

export const StylesTreeProviderLive = treeDataProvider<VscodeTreeNode>(
  'nativeTwin-styles',
)((refresh) => {
  return Effect.gen(function* () {
    yield* NativeTwinManagerService;
    const currentClient = yield* ScopedRef.make<void>(() => void 0);
    let nodes: Array<TreeInfoNode> = [];
    Effect.gen(function* () {
      yield* ScopedRef.set(currentClient, Effect.void);
      nodes = [];
      return yield* refresh(Option.none());
    });

    return TreeDataProvider<VscodeTreeNode>({
      children: Option.match({
        onNone: () => Effect.succeedSome(nodes),
        onSome: (node) => Effect.succeed(children(node)),
      }),
      treeItem: (node) => Effect.succeed(treeItem(node)),
    });
  });
});

const children = (node: VscodeTreeNode): Option.Option<Array<VscodeTreeNode>> => {
  switch (node._tag) {
    case 'TreeInfoNode':
      return Option.some([node]);
  }
};

const treeItem = (node: VscodeTreeNode): vscode.TreeItem => {
  switch (node._tag) {
    case 'TreeInfoNode':
      const item = new vscode.TreeItem(node.key, vscode.TreeItemCollapsibleState.None);
      item.description = node.value;
      item.tooltip = node.value;
      item.contextValue = 'info';
      return item;
  }
};
