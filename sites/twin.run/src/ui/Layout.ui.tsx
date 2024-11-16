import * as vscode from 'vscode';
import { ReactNode } from 'react';
import * as monaco from 'monaco-editor';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { TwinEditorService } from '@/editor/services/TwinEditor.service';

interface PlaygroundLayoutProps {
  children: ReactNode;
  fs: FileSystemService['Type'];
  app: TwinEditorService['Type'];
}

export const PlaygroundLayout = ({ children, fs, app }: PlaygroundLayoutProps) => {
  const makeFSAction = async (data: { uri: vscode.Uri; contents: string }) => {
    console.log(
      'MODELS: ',
      fs.getRegisteredModules().map((x) => x.uri.path),
    );

    const file = monaco.editor.getModel(data.uri);

    if (!file) return;

    await app.wrapper.updateCodeResources({
      main: {
        uri: file.uri.toString(),
        text: file.getValue(),
      },
    });
    app.wrapper.updateLayout();
    // app.getEditor().pipe(Option.map((x) => x.setModel(file)));
  };
  return (
    <div className='flex flex-1 w-screen h-screen flex-col'>
      <header className='flex flex-1 min-h-10 justify-start items-center'>
        <a
          href='#'
          className='editor-action-button'
          onClick={() => {
            makeFSAction(fs.files.component);
          }}
        >
          <span>Open Component file</span>
        </a>
        <a
          href='#'
          className='editor-action-button'
          onClick={() => {
            makeFSAction(fs.files.css);
          }}
        >
          <span>Open Css file</span>
        </a>
        <a
          href='#'
          className='editor-action-button'
          onClick={() => {
            makeFSAction(fs.files.twinConfig);
          }}
        >
          <span>Open Native Twin Config</span>
        </a>
      </header>
      <div className='w-full h-full'>{children}</div>
    </div>
  );
};
