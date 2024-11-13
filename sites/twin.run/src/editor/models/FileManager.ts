import type { IStoredWorkspace } from '@codingame/monaco-vscode-configuration-service-override';
import {
  RegisteredMemoryFile,
  registerFileSystemOverlay,
  RegisteredFileSystemProvider,
} from '@codingame/monaco-vscode-files-service-override';
import * as monaco from 'monaco-editor';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import * as vscode from 'vscode';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { IReference, ITextFileEditorModel } from 'vscode/monaco';

export class ___FileManager {
  focusDocument: vscode.TextDocument | undefined;
  readonly workspaceFile = monaco.Uri.file('/workspace.code-workspace');
  readonly rootPath = '/workspace';
  readonly fileSystemProvider = new RegisteredFileSystemProvider(false);
  readonly languageId = 'typescript';
  readonly fileSystemOverlay: monaco.IDisposable;

  constructor(readonly editor: MonacoEditorLanguageClientWrapper) {
    this.fileSystemProvider.registerFile(
      new RegisteredMemoryFile(
        this.workspaceFile,
        JSON.stringify({
          folders: [
            {
              path: '/workspace',
              uri: '/workspace',
              name: 'workspace',
            },
          ],
        } as IStoredWorkspace),
      ),
    );

    this.fileSystemProvider.registerFile(
      new RegisteredMemoryFile(
        vscode.Uri.file(`${this.rootPath}/tsconfig.json`),
        `{
          "compilerOptions": {
            "jsx": "preserve",
            "module": "ESNext",
            "lib": ["Dom", "ESNext"]
          }
        }`,
      ),
    );
    this.fileSystemOverlay = registerFileSystemOverlay(1, this.fileSystemProvider);
  }

  async createFile(name: string, content: string) {
    const file = new RegisteredMemoryFile(
      vscode.Uri.file(`${this.rootPath}/${name}`),
      content,
    );
    this.fileSystemProvider.registerFile(file);
    const modelRef = await monaco.editor.createModelReference(file.uri);
    modelRef.object.setLanguageId('typescript');
    return modelRef;
  }

  openFile(model: IReference<ITextFileEditorModel>) {
    // this.editor.getEditor()?.getModel()?.dispose();
    this.editor.getEditor()?.setModel(model.object.textEditorModel);
  }

  fileToURI(name: string) {
    return vscode.Uri.file(`${this.rootPath}/${name}`);
  }

  createDocument(vscodeDocument: vscode.TextDocument) {
    return TextDocument.create(
      vscodeDocument.uri.toString(),
      vscodeDocument.languageId,
      vscodeDocument.version,
      vscodeDocument.getText(),
    );
  }
}

export interface TypescriptRegisteredTyping {
  disposable: monaco.IDisposable;
  model: monaco.editor.ITextModel;
}
