import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Scope from 'effect/Scope';
import * as vscode from 'vscode';
import {
  compileReactCode,
  BuildConfig,
  makeBabelLayer,
} from '@native-twin/compiler/babel';
import { NativeTwinServiceNode } from '@native-twin/compiler/node';
import { VscodeContext } from '../extension/extension.service';
import { emitterOptional, runWithTokenDefault } from '../extension/extension.utils';
import { TwinTextDocument } from '../language';
import { TreeDataProvider } from './models/VscodeTree.models';

export const uriToID = (uri: vscode.Uri) => uri.toString();

export const getTwinDocumentID = (doc: TwinTextDocument) => uriToID(doc.document.uri);

export const getCompiledTwinDocument = (
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

export const makeTreeDataProvider =
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
        resolveTreeItem: (item, element, token) => {
          if (provider.resolve) {
            return runWithTokenDefault(
              Effect.map(provider.resolve!(item, element), Option.getOrUndefined),
              token,
            );
          }
          return undefined;
        },
      };
      const context = yield* VscodeContext;
      const treeView = vscode.window.createTreeView(name, {
        treeDataProvider: vscodeProvider,
        showCollapseAll: true,
      });
      context.subscriptions.push(treeView);
    }).pipe(Layer.scopedDiscard);
