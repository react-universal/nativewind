import * as vscode from 'vscode';
import { sheetEntriesToCss } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import {
  EditorAppExtended,
  MonacoEditorLanguageClientWrapper,
  RegisterLocalProcessExtensionResult,
  WrapperConfig,
} from 'monaco-editor-wrapper';
import {
  Constants,
  NativeTwinManagerService,
  TwinMonacoTextDocument,
} from '@native-twin/language-service/browser';
import reactJSXRaw from '@/fixtures/react/Basic.react?raw';
import twinConfigRaw from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import { WorkspaceConfig } from '../models/EditorFixture.model';

const make = Effect.gen(function* () {
  const twin = yield* NativeTwinManagerService;
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const workspace = new WorkspaceConfig({
    jsx: reactJSXRaw,
    twinConfig: twinConfigRaw,
  });

  const monacoApp = Effect.promise(() =>
    pipe(
      wrapper.getMonacoEditorApp() as EditorAppExtended,
      (app): RegisterLocalProcessExtensionResult =>
        app.getExtensionRegisterResult(workspace.twinExtensionID) as any,
      (result) => result.setAsDefaultApi().then(() => result),
    ),
  );

  const getDocumentPreview = (document: vscode.TextDocument) => {
    const twinDocument = new TwinMonacoTextDocument(
      document,
      Constants.DEFAULT_PLUGIN_CONFIG,
    );
    const regions = twinDocument.getLanguageRegions();
    const entries = RA.flatMap(regions, (x) => twin.tw(`${x.text}`));
    return {
      code: document.getText(),
      regions,
      extracted: entries,
      css: sheetEntriesToCss(twin.tw.target),
    };
  };

  return {
    workspace,
    wrapper,
    getDocumentPreview,
    initEditor: (config: WrapperConfig) => Effect.promise(() => wrapper.init(config)),
    startEditor: () => Effect.promise(() => wrapper.start()),
    openTextDocument: (uri: vscode.Uri) =>
      Effect.promise(() => vscode.workspace.openTextDocument(uri)),
    monacoApp,
    getApi: () => monacoApp.pipe(Effect.flatMap((x) => Effect.promise(() => x.getApi()))),
  };
});

export class MonacoContext extends Context.Tag('editor/workspace/config')<
  MonacoContext,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(MonacoContext, make);
}

export const workspaceDefaultConfig = new WorkspaceConfig({
  jsx: reactJSXRaw,
  twinConfig: twinConfigRaw,
});
