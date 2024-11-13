// import editorUserConfigJSON from '@/fixtures/editor-config/configuration.json?raw';
// import nativeTwinCustomTheme from '@/fixtures/tailwind-configs/custom-theme.config?raw';
// import nativeTwinEmpty from '@/fixtures/tailwind-configs/empty.config?raw';
// import nativeTwinPresetTw from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import * as vscode from 'vscode';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as monaco from 'monaco-editor';
import reactComponentRaw from '@/fixtures/react/Basic.react?raw';
import tailwindConfigRaw from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import { createEditorFileModel, pathToMonacoURI } from '@/utils/editor.utils';
import { TwinTyping } from '@/utils/twin.schemas';
import { TypescriptRegisteredTyping } from '../models/FileManager';

const make = Effect.gen(function* () {
  // const fileSystemProvider = new RegisteredFileSystemProvider(false);
  const reactComponentFileUri = vscode.Uri.file('Component.tsx');
  const tailwindConfigFileUri = vscode.Uri.file('tailwind.config.ts');
  const cssFileUri = vscode.Uri.file('input.css');

  // const tailwindConfigFile = new RegisteredMemoryFile(
  //   tailwindConfigFileUri,
  //   tailwindConfigRaw,
  // );

  // fileSystemProvider.registerFile(tailwindConfigFile);
  // const reactFile = new RegisteredMemoryFile(reactComponentFileUri, reactComponentRaw);
  // fileSystemProvider.registerFile(reactFile);

  // const cssFile = new RegisteredMemoryFile(cssFileUri, '');
  // fileSystemProvider.registerFile(cssFile);

  // const twinConfigFileModel = yield* Effect.promise(() =>
  //   monaco.editor.createModelReference(tailwindConfigFile.uri),
  // );
  // const reactFileModel = yield* Effect.promise(() =>
  //   monaco.editor.createModelReference(reactFile.uri),
  // );

  // const cssFileModel = yield* Effect.promise(() =>
  //   monaco.editor.createModelReference(cssFile.uri),
  // );

  // registerFileSystemOverlay(1, fileSystemProvider);

  const createMonacoFileModel = (uri: vscode.Uri, contents: string) =>
    monaco.editor.createModelReference(uri, contents);

  const getRegisteredModules = () =>
    monaco.editor.getModels().filter((x) => !x.uri.path.startsWith('/node_modules'));
  return {
    registerTypescriptTyping,
    createMonacoFileModel,
    getRegisteredModules,
    files: {
      css: {
        uri: cssFileUri,
        contents: '',
      },
      twinConfig: {
        uri: tailwindConfigFileUri,
        contents: tailwindConfigRaw,
      },
      component: {
        uri: reactComponentFileUri,
        contents: reactComponentRaw,
      },
    },
    // models: {
    //   css: cssFileModel,
    //   component: reactFileModel,
    //   twinConfig: twinConfigFileModel,
    // },
  };
});

export class FileSystemService extends Context.Tag('editor/files/FileSystemService')<
  FileSystemService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(FileSystemService, make);
}

const registerTypescriptTyping = (typing: TwinTyping) =>
  Effect.sync<TypescriptRegisteredTyping>(() => ({
    disposable: monaco.languages.typescript.typescriptDefaults.addExtraLib(
      typing.contents,
      typing.filePath,
    ),
    model: createEditorFileModel(pathToMonacoURI(typing.filePath), typing.contents),
  }));
