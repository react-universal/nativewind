import type * as vscode from 'vscode';
import * as path from 'path';
import {
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as monaco from 'monaco-editor';
import { detectLanguageFromPath } from '../../utils/editor.utils';
import { traceLayerLogs } from '../../utils/logger.utils';
import { MonacoContext } from './MonacoContext.service';

const make = Effect.gen(function* () {
  const context = yield* MonacoContext;
  const fsProvider = new RegisteredFileSystemProvider(false);

  const createFileInMemory = (uri: vscode.Uri, contents: string) => {
    return new RegisteredMemoryFile(uri, contents);
  };

  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.projectFiles.jsx.uri,
      context.workspace.projectFiles.jsx.contents,
    ),
  );
  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.projectFiles.twinConfig.uri,
      context.workspace.projectFiles.twinConfig.contents,
    ),
  );
  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.rootFiles.inputCSS.uri,
      context.workspace.rootFiles.inputCSS.contents,
    ),
  );
  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.rootFiles.packageJson.uri,
      context.workspace.rootFiles.packageJson.contents,
    ),
  );
  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.rootFiles.tsconfig.uri,
      context.workspace.rootFiles.tsconfig.contents,
    ),
  );

  fsProvider.registerFile(
    createFileInMemory(
      context.workspace.rootFiles.workspaceFile.uri,
      context.workspace.rootFiles.workspaceFile.contents,
    ),
  );

  registerFileSystemOverlay(1, fsProvider);

  const getRegisteredModules = () =>
    monaco.editor.getModels().filter((x) => !x.uri.path.startsWith('/node_modules'));

  const getOrCreateModel = (filePath: string, defaultValue = '') => {
    const uri = monaco.Uri.file(path.join('/workspace', filePath));

    return (
      monaco.editor.getModel(uri) ||
      monaco.editor.createModel(
        defaultValue,
        detectLanguageFromPath(filePath) ?? 'typescript',
        uri,
      )
    );
  };

  const createEditorModelRef = (uri: vscode.Uri, contents: string) =>
    Effect.tryPromise(() => monaco.editor.createModelReference(uri, contents));

  return {
    getRegisteredModules,
    createFileInMemory,
    getOrCreateModel,
    createEditorModelRef,
    fsProvider,
  };
});

export class FileSystemService extends Context.Tag('editor/files/FileSystemService')<
  FileSystemService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(FileSystemService, make).pipe(traceLayerLogs('fs'));
}
