import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as vscode from 'vscode';

export interface TreeDataProvider<A> {
  readonly treeItem: (element: A) => Effect.Effect<vscode.TreeItem>;
  readonly children: (
    element: Option.Option<A>,
  ) => Effect.Effect<Option.Option<Array<A>>>;
  readonly parent?: (element: A) => Effect.Effect<Option.Option<A>>;
  readonly resolve?: (
    item: vscode.TreeItem,
    element: A,
  ) => Effect.Effect<Option.Option<vscode.TreeItem>>;
}

export const TreeDataProvider = <A>(_: TreeDataProvider<A>) => _;

export class TreeInfoNode {
  readonly _tag = 'TreeInfoNode';
  constructor(
    readonly label: string,
    readonly description: string,
  ) {}
}
