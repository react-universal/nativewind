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
import { FileManager } from '../models/FileManager';
import { TwinEditorConfigService } from './EditorConfig.service';

const make = Effect.gen(function* () {
  const { config } = yield* TwinEditorConfigService;
  const domElement = document.getElementById('monaco-editor-root')!;
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const fileManager = new FileManager(wrapper);

  const getEditor = () => Option.fromNullable(wrapper.getEditor());
  const getMonacoApp = (): Option.Option<NonNullable<EditorAppExtended>> =>
    Option.fromNullable(wrapper.getMonacoEditorApp() as EditorAppExtended | undefined);

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
    fileManager,
  };
});

export class TwinEditorService extends Context.Tag('editor/main/service')<
  TwinEditorService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(TwinEditorService, make);
}

const registerTwinLanguages = Effect.sync(() => {
  monaco.languages.register({
    id: 'typescript',
    extensions: ['.ts', '.tsx'],
    aliases: ['ts', 'TS', 'tsx', 'typescriptreact'],
    mimetypes: ['text/typescript', 'text/javascript'],
  });
  monaco.languages.register({
    id: 'javascript',
    extensions: ['.js', '.jsx'],
    aliases: ['js', 'JS', 'jsx', 'javascriptreact'],
    mimetypes: ['text/plain', 'text/javascript'],
  });
  monaco.languages.register({
    id: 'css',
    extensions: ['.css', '.scss'],
    aliases: ['css', 'CSS', 'sass', 'SASS'],
    mimetypes: ['text/plain', 'text/css'],
  });
  monaco.languages.register({
    id: 'html',
    extensions: ['.html', '.xhtml'],
    aliases: ['html', 'HTML', 'XHTML', 'html5'],
    mimetypes: ['text/plain', 'text/html'],
  });
  monaco.languages.register({
    id: 'json',
    extensions: ['.json'],
    mimetypes: ['text/plain', 'text/plain', 'application/json'],
  });
});
