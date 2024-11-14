import * as vscode from 'vscode';
import * as Effect from 'effect/Effect';
import * as monaco from 'monaco-editor';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { TwinEditorService } from '@/editor/services/TwinEditor.service';

export const SetupEditorUI = Effect.gen(function* () {
  const fs = yield* FileSystemService;
  const app = yield* TwinEditorService;

  const buttonsContainer = document.createElement('div', { is: 'container' });
  buttonsContainer.setAttribute('class', 'editor-buttons-container');

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

  // app.getEditor().pipe(
  //   Option.map((x) =>
  //     x.onDidChangeModel(async (model) => {
  //       if (!model.newModelUrl) return;
  //       const file = monaco.editor.getModel(model.newModelUrl);
  //       if (!file) return;
  //       console.log('MODEL: ', file);
  //       // await vscode.workspace.openTextDocument(file.uri);
  //       await EditorMainRuntime.runPromise(
  //         workers.installPackagesTypings(TWIN_PACKAGES_TYPINGS),
  //       );
  //     }),
  //   ),
  // );

  const openComponentButton = createActionButton('Open Component file', async () =>
    makeFSAction(fs.files.component),
  );
  const openCSSButton = createActionButton('Open Css file', async () =>
    makeFSAction(fs.files.css),
  );
  const openTwinConfigButton = createActionButton('Open Native Twin Config', async () =>
    makeFSAction(fs.files.twinConfig),
  );

  buttonsContainer.prepend(openComponentButton);
  buttonsContainer.append(openCSSButton);
  buttonsContainer.append(openTwinConfigButton);
  document.body.prepend(buttonsContainer);
});

const createActionButton = (text: string, onClick: () => Promise<void>) => {
  const buttonElement = document.createElement('a', { is: 'container' });
  buttonElement.setAttribute('class', 'editor-action-button');
  buttonElement.setAttribute('href', '#');
  buttonElement.onclick = async (e) => {
    e.preventDefault();
    await onClick();
  };
  buttonElement.innerText = text;
  return buttonElement;
};
