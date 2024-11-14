import * as vscode from 'vscode';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as monaco from 'monaco-editor';
import {
  EditorAppExtended,
  MonacoEditorLanguageClientWrapper,
} from 'monaco-editor-wrapper';
import { traceLayerLogs } from '@/utils/logger.utils';
import { FileSystemService } from './FileSystem.service';

const make = Effect.gen(function* () {
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const fs = yield* FileSystemService;

  const getEditor = () => Option.fromNullable(wrapper.getEditor());
  const getMonacoApp = (): Option.Option<NonNullable<EditorAppExtended>> =>
    Option.fromNullable(wrapper.getMonacoEditorApp() as EditorAppExtended | undefined);

  const createMonacoFileModel = (uri: vscode.Uri, contents: string) =>
    Effect.gen(function* () {
      const modelRef = yield* Effect.tryPromise(() =>
        monaco.editor.createModelReference(uri, contents),
      );
      return modelRef;
    });

  return {
    createMonacoFileModel,
    wrapper,
    getEditor,
    getMonacoApp,
  };
});

export class TwinEditorService extends Context.Tag('editor/main/service')<
  TwinEditorService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(TwinEditorService, make).pipe(
    traceLayerLogs('TwinEditorService'),
  );
}
