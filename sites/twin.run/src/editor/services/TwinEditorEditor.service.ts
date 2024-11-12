import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as monaco from 'monaco-editor';
import {
  EditorAppExtended,
  MonacoEditorLanguageClientWrapper,
} from 'monaco-editor-wrapper';
import { ITextModel } from 'vscode/vscode/vs/editor/common/model';
import { IStandaloneCodeEditor } from 'vscode/vscode/vs/editor/standalone/browser/standaloneCodeEditor';
import { LanguageClientService } from './Language.Service';

export class TwinEditorService extends Context.Tag('TwinEditorContext')<
  TwinEditorService,
  {
    // initWorkers: Effect.Effect<void>;
    makeEditor: Effect.Effect<void>;
    getEditor: () => Option.Option<IStandaloneCodeEditor>;
    getMonacoApp: () => Option.Option<NonNullable<EditorAppExtended>>;
    wrapper: MonacoEditorLanguageClientWrapper;
    getCurrentFile: Effect.Effect<Option.Option<ITextModel>>;
  }
>() {
  static Live = Layer.scoped(
    TwinEditorService,
    Effect.gen(function* () {
      const languageClient = yield* LanguageClientService;
      const domElement = document.getElementById('monaco-editor-root')!;
      const wrapper = new MonacoEditorLanguageClientWrapper();
      const config = yield* languageClient.config;

      const getEditor = () => Option.fromNullable(wrapper.getEditor());
      const getMonacoApp = (): Option.Option<NonNullable<EditorAppExtended>> =>
        Option.fromNullable(
          wrapper.getMonacoEditorApp() as EditorAppExtended | undefined,
        );

      const getCurrentFile = () =>
        pipe(
          Option.fromNullable(wrapper.getEditor()),
          Option.flatMap((x) => Option.fromNullable(x.getModel())),
        );

      return {
        makeEditor: Effect.gen(function* () {
          yield* Effect.promise(() => wrapper.initAndStart(config, domElement));
          yield* registerTwinLanguages;
        }),
        wrapper,
        getEditor,
        getMonacoApp,
        getCurrentFile: Effect.sync(() => getCurrentFile()),
      };
    }),
  );
}

const registerTwinLanguages = Effect.sync(() => {
  monaco.languages.register({
    id: 'typescript',
    extensions: ['.ts', '.tsx'],
    aliases: ['ts', 'TS', 'tsx'],
    mimetypes: ['text/typescript', 'text/javascript'],
  });
  monaco.languages.register({
    id: 'javascript',
    extensions: ['.js', '.jsx'],
    aliases: ['js', 'JS', 'jsx'],
    mimetypes: ['plain/text', 'text/javascript'],
  });
  monaco.languages.register({
    id: 'html',
    extensions: ['.html', '.html'],
    aliases: ['html', 'HTML', 'htm'],
    mimetypes: ['plain/text', 'text/html'],
  });
  monaco.languages.register({
    id: 'css',
    extensions: ['.css'],
    aliases: ['css', 'CSS'],
    mimetypes: ['plain/text', 'text/css'],
  });
  monaco.languages.register({
    id: 'json',
    extensions: ['.json'],
    aliases: ['json'],
    mimetypes: ['plain/text', 'text/json'],
  });

  monaco.languages.register({
    id: 'markdown',
    extensions: ['.md', '.mdx', '.MD'],
    aliases: ['md', 'MD', 'mdx'],
    mimetypes: ['plain/text', 'text/markdown'],
  });
});
