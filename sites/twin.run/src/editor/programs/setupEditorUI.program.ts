import type * as vscode from 'vscode';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { FileSystemService } from '../services/FileSystem.service';
import { TwinEditorService } from '../services/TwinEditorEditor.service';

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

    const file = await fs.createMonacoFileModel(data.uri, data.contents);
    app.getEditor().pipe(Option.map((x) => x.setModel(file.object.textEditorModel)));
  };

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
