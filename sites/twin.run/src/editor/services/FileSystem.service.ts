import {
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override';
import * as vscode from 'vscode';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as monaco from 'monaco-editor';
import reactJSXRaw from '@/fixtures/react/Basic.react?raw';
import twinConfigRaw from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import npmPkgRaw from '@/fixtures/typescript/package.editor.json?raw';
import tsconfigRaw from '@/fixtures/typescript/tsconfig.editor.json?raw';
import { createEditorFileModel, pathToMonacoURI } from '@/utils/editor.utils';
import { traceLayerLogs } from '@/utils/logger.utils';
import { TwinTyping, TypescriptRegisteredTyping } from '@/utils/twin.schemas';

const make = Effect.gen(function* () {
  const fsProvider = new RegisteredFileSystemProvider(false);

  const reactComponentFileUri = vscode.Uri.file('/workspace/Component.tsx');
  const twinConfigFileUri = vscode.Uri.file('/workspace/tailwind.config.ts');
  const cssFileUri = vscode.Uri.file('/workspace/input.css');
  const npmPackageFileUri = vscode.Uri.file('/workspace/package.json');
  const tsconfigFileUri = vscode.Uri.file('/workspace/tsconfig.json');

  const createFileInMemory = (uri: vscode.Uri, contents: string) => {
    return new RegisteredMemoryFile(uri, contents);
  };

  fsProvider.registerFile(createFileInMemory(reactComponentFileUri, reactJSXRaw));
  fsProvider.registerFile(createFileInMemory(twinConfigFileUri, twinConfigRaw));
  fsProvider.registerFile(createFileInMemory(cssFileUri, ':root {}'));
  fsProvider.registerFile(createFileInMemory(npmPackageFileUri, npmPkgRaw));
  fsProvider.registerFile(createFileInMemory(tsconfigFileUri, tsconfigRaw));

  const getRegisteredModules = () =>
    monaco.editor.getModels().filter((x) => !x.uri.path.startsWith('/node_modules'));

  registerFileSystemOverlay(1, fsProvider);

  return {
    registerTypescriptTyping,
    getRegisteredModules,
    createFileInMemory,
    fsProvider,
    files: {
      css: {
        uri: cssFileUri,
        contents: '',
      },
      twinConfig: {
        uri: twinConfigFileUri,
        contents: twinConfigRaw,
      },
      component: {
        uri: reactComponentFileUri,
        contents: reactJSXRaw,
      },
      tsconfig: {
        uri: tsconfigFileUri,
        contents: tsconfigRaw,
      },
      npmPackage: {
        uri: npmPackageFileUri,
        contents: npmPkgRaw,
      },
    },
  };
});

export class FileSystemService extends Context.Tag('editor/files/FileSystemService')<
  FileSystemService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(FileSystemService, make).pipe(traceLayerLogs('fs'));
}

const registerTypescriptTyping = (typing: TwinTyping) =>
  Effect.sync<TypescriptRegisteredTyping>(() => ({
    disposable: monaco.languages.typescript.typescriptDefaults.addExtraLib(
      typing.contents,
      typing.filePath,
    ),
    model: createEditorFileModel(pathToMonacoURI(typing.filePath), typing.contents),
  }));
