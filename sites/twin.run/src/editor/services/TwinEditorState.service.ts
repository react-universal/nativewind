import * as vscode from 'vscode';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import * as Data from 'effect/Data';
import type { CodeResources } from 'monaco-editor-wrapper';
import * as PubSub from 'effect/PubSub';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import type { WorkspaceConfig } from '../models/EditorFixture.model';
import { MonacoContext, MonacoContextLive } from './MonacoContext.service';

export type EditorAction = Data.TaggedEnum<{
  UpdateResources: { file: keyof WorkspaceConfig['projectFiles'] };
  Start: { domElement: HTMLElement };
}>;

export const EditorAction = Data.taggedEnum<EditorAction>();

export interface TwinEditorState {
  isReady: boolean;
  initialized: boolean;
  resources: CodeResources;
}

const make = Effect.gen(function* () {
  const { workspace, getMonacoApp, initEditor, wrapper } = yield* MonacoContext;
  const hub = yield* PubSub.unbounded<EditorAction>();
  const state = yield* SubscriptionRef.make<TwinEditorState>({
    initialized: false,
    isReady: false,
    resources: {
      original: {
        text: workspace.projectFiles.jsx.contents,
        uri: workspace.projectFiles.jsx.uri.path,
      },
      modified: {
        text: workspace.projectFiles.jsx.contents,
        uri: workspace.projectFiles.jsx.uri.path,
      },
    },
  });

  const events = yield* subscribe();

  yield* events.pipe(
    Stream.mapEffect(
      EditorAction.$match({
        UpdateResources: (data) => onChangeResource(data.file),
        Start: ({ domElement }) =>
          initEditor().pipe(
            Effect.andThen(() => setResources('jsx')),
            Effect.andThen(() => wrapper.start(domElement)),
            Effect.tap(() => Effect.log('CONTENTS: ', wrapper.getTextContents())),
            Effect.andThen(() =>
              Effect.promise(() =>
                vscode.workspace.openTextDocument(workspace.projectFiles.jsx.uri),
              ),
            ),
            Effect.andThen(() =>
              SubscriptionRef.update(state, (data) => ({ ...data, isReady: true })),
            ),
          ),
      }),
    ),
    Stream.tapError((error) => Effect.logError('State Error: ', error)),
    Stream.runDrain,
    Effect.forkScoped,
  );

  return {
    state,
    subscribe,
    bootEditor,
    setResources,
  };

  function bootEditor(domElement: HTMLElement) {
    return Effect.runSync(hub.publish(EditorAction.Start({ domElement })));
  }

  function setResources(file: keyof WorkspaceConfig['projectFiles']) {
    return Effect.runSync(hub.publish(EditorAction.UpdateResources({ file })));
  }

  function subscribe() {
    return PubSub.subscribe(hub).pipe(
      Effect.andThen((_) =>
        Effect.addFinalizer(() => _.shutdown).pipe(
          Effect.tap(() => Effect.log('Shutdown PubSub Queue')),
          Effect.map(() => _),
        ),
      ),
      Effect.tap(() => Effect.log('Subscribe to Editor state')),
      Effect.map(Stream.fromQueue),
    );
  }

  function onChangeResource(file: keyof WorkspaceConfig['projectFiles']) {
    const { contents, uri } = workspace.projectFiles[file];
    const update = {
      original: {
        text: contents,
        uri: uri.path,
      },
      modified: {
        text: contents,
        uri: uri.path,
      },
    };
    return getMonacoApp().pipe(
      Effect.andThen((app) => Effect.promise(() => app.updateCodeResources(update))),
      Effect.andThen(() => wrapper.getEditor()?.focus()),
      Effect.andThen(() =>
        SubscriptionRef.update(state, (prev) => ({
          ...prev,
          resources: update,
        })),
      ),
    );
  }
});

export interface TwinEditorStateCtx extends Effect.Effect.Success<typeof make> {}
export const TwinEditorStateCtx =
  Context.GenericTag<TwinEditorStateCtx>('TwinEditorStateCtx');
export const TwinEditorStateCtxLive = Layer.scoped(TwinEditorStateCtx, make).pipe(
  Layer.provide(MonacoContextLive),
);
