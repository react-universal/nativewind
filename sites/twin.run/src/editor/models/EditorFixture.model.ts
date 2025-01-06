import * as vscode from 'vscode';
import type * as monaco from 'monaco-editor';
import type { CodeResources, EditorAppConfig } from 'monaco-editor-wrapper';
import type { IStoredWorkspace } from 'vscode/service-override/configuration';
import npmPkgRaw from '../../fixtures/typescript/package.editor.json?raw';
import tsconfigRaw from '../../fixtures/typescript/tsconfig.editor.json?raw';

export interface FixtureFile {
  uri: vscode.Uri;
  contents: string;
}

export class WorkspaceConfig {
  readonly homeDir = '';
  readonly workspacePath = `${this.homeDir}/workspace`;
  readonly twinExtensionID = 'native-twin-vscode';
  readonly twinExtensionPublisher = 'native.twin';

  readonly projectFiles: {
    twinConfig: FixtureFile;
    jsx: FixtureFile;
  };

  constructor(contents: { twinConfig: string; jsx: string }) {
    const jsxFileUri = vscode.Uri.file('/workspace/Component.tsx');
    const twinConfigFileUri = vscode.Uri.file('/workspace/tailwind.config.ts');

    this.projectFiles = {
      jsx: {
        uri: jsxFileUri,
        contents: contents.jsx,
      },
      twinConfig: {
        uri: twinConfigFileUri,
        contents: contents.twinConfig,
      },
    };
  }

  get editorDomElement() {
    return document.getElementById('monaco-editor-root')!;
  }

  get initialResources(): CodeResources['original'] {
    return {
      uri: this.projectFiles.jsx.uri.path,
      text: this.projectFiles.jsx.contents,
    };
  }

  get rootFiles() {
    const workspaceFile: FixtureFile = {
      uri: vscode.Uri.file('/workspace/.vscode/workspace.code-workspace'),
      contents: getWorkspaceFileRaw(this.workspacePath),
    };
    const packageJson: FixtureFile = {
      uri: vscode.Uri.file('/workspace/package.json'),
      contents: npmPkgRaw,
    };
    const tsconfig: FixtureFile = {
      uri: vscode.Uri.file('/workspace/tsconfig.json'),
      contents: tsconfigRaw,
    };
    const inputCSS: FixtureFile = {
      uri: vscode.Uri.file('/workspace/input.css'),
      contents: '',
    };
    const outputCSS: FixtureFile = {
      uri: vscode.Uri.file('/workspace/output.css'),
      contents: '',
    };

    return {
      workspaceFile,
      tsconfig,
      packageJson,
      inputCSS,
      outputCSS,
    };
  }

  getMonacoDefaultConfig = (): monaco.editor.IStandaloneEditorConstructionOptions => {
    return {
      glyphMargin: false,
      guides: {
        bracketPairs: true,
      },
      automaticLayout: false,
      minimap: { enabled: false },
      disableMonospaceOptimizations: false,
      fontFamily: 'Fira Code',
      fontWeight: '450',
      fontLigatures: false,
      colorDecorators: true,
      defaultColorDecorators: true,
    };
  };

  getExtendedAppConfig = (): EditorAppConfig => {
    return {
      editorOptions: this.getMonacoDefaultConfig(),
      codeResources: {
        original: {
          text: this.projectFiles.jsx.contents,
          uri: this.projectFiles.jsx.uri.path,
        },
      },
      useDiffEditor: false,
      // htmlContainer: this.editorDomElement,
    };
  };
}

const getWorkspaceFileRaw = (workspacePath: string) => {
  return JSON.stringify(
    {
      folders: [
        {
          name: 'workspace',
          path: workspacePath,
        },
      ],
    } as IStoredWorkspace,
    null,
    2,
  );
};
