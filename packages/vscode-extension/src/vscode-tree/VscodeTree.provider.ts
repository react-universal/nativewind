import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Scope from 'effect/Scope';
import * as vscode from 'vscode';
import { VscodeContext } from '../extension/extension.service';
import { emitterOptional, runWithTokenDefault } from '../extension/extension.utils';
import { TreeDataProvider } from './VscodeTree.models';

export const treeDataProvider =
  <A>(name: string) =>
  <R, E>(
    create: (
      refresh: (data: Option.Option<A | Array<A>>) => Effect.Effect<void>,
    ) => Effect.Effect<TreeDataProvider<A>, E, R>,
  ): Layer.Layer<never, E, Exclude<R, Scope.Scope> | VscodeContext> =>
    Effect.gen(function* () {
      const onChange = yield* emitterOptional<A | Array<A>>();
      const provider = yield* create(onChange.fire);
      const vscodeProvider: vscode.TreeDataProvider<A> = {
        onDidChangeTreeData: onChange.event,
        getTreeItem(element) {
          return Effect.runPromise(provider.treeItem(element));
        },
        getChildren(element) {
          return Effect.runPromise(
            Effect.map(
              provider.children(Option.fromNullable(element)),
              Option.getOrUndefined,
            ),
          );
        },
        getParent: provider.parent
          ? (element) =>
              Effect.runPromise(
                Effect.map(provider.parent!(element), Option.getOrUndefined),
              )
          : undefined,
        resolveTreeItem: provider.resolve
          ? (item, element, token) =>
              runWithTokenDefault(
                Effect.map(provider.resolve!(item, element), Option.getOrUndefined),
                token,
              )
          : undefined,
      };
      const context = yield* VscodeContext;
      context.subscriptions.push(
        vscode.window.createTreeView(name, {
          treeDataProvider: vscodeProvider,
          showCollapseAll: true,
        }),
      );
    }).pipe(Layer.scopedDiscard);
