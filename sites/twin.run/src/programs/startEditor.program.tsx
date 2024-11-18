import 'vscode';
import * as Effect from 'effect/Effect';
import ReactDOM from 'react-dom/client';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { MonacoContext } from '@/editor/services/MonacoContext.service';
import { EditorUIProvider } from '@/ui/Editor.context';
import { EditorApp } from '@/ui/Editor.ui';
import { PlaygroundLayout } from '@/ui/Layout.ui';
import { TwinEditorConfigService } from '../editor/services/EditorConfig.service';

export const StartEditorUIProgram = Effect.gen(function* () {
  const context = yield* MonacoContext;
  const config = yield* TwinEditorConfigService;
  const fs = yield* FileSystemService;

  const root = ReactDOM.createRoot(context.workspace.editorDomElement);
  const App = () => {
    return (
      <EditorUIProvider app={context} fs={fs} config={config}>
        <PlaygroundLayout>
          <EditorApp />
        </PlaygroundLayout>
      </EditorUIProvider>
    );
  };
  root.render(<App />);
});
