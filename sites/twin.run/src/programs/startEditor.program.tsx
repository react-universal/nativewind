import 'vscode';
import * as Effect from 'effect/Effect';
import ReactDOM from 'react-dom/client';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { EditorApp } from '@/ui/Editor.ui';
import { registerEditorLanguages } from '@/utils/editor.utils';
import { TwinEditorConfigService } from '../editor/services/EditorConfig.service';
import { TwinEditorService } from '../editor/services/TwinEditor.service';
import { PlaygroundLayout } from '../ui/Layout.ui';

export const StartEditorProgram = Effect.gen(function* () {
  const domElement = document.getElementById('monaco-editor-root')!;
  const config = yield* TwinEditorConfigService;
  const editor = yield* TwinEditorService;
  const fs = yield* FileSystemService;

  // yield* Effect.promise(() => editor.wrapper.init(config.monacoEditorConfig));

  // yield* Effect.promise(() => vscode.workspace.openTextDocument(fs.files.component.uri));
  // yield* Effect.promise(() => vscode.workspace.openTextDocument(fs.files.twinConfig.uri));
  // yield* Effect.promise(() => vscode.workspace.openTextDocument(fs.files.css.uri));

  // yield* Effect.promise(() => editor.wrapper.start(domElement)).pipe(
  //   Effect.andThen(Effect.log('Native Twin language wrapper started')),
  // );

  yield* Effect.sync(() => registerEditorLanguages()).pipe(
    Effect.andThen(Effect.logDebug(Effect.log('Registered vscode languages'))),
  );

  const root = ReactDOM.createRoot(domElement);

  const App = () => {
    return (
      <PlaygroundLayout fs={fs} app={editor}>
        <EditorApp config={config} editor={editor} fs={fs} />
      </PlaygroundLayout>
    );
  };
  root.render(<App />);
});
