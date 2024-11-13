import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import {
  EditorAppExtended,
  MonacoEditorLanguageClientWrapper,
} from 'monaco-editor-wrapper';

const make = Effect.gen(function* () {
  const wrapper = new MonacoEditorLanguageClientWrapper();

  const getEditor = () => Option.fromNullable(wrapper.getEditor());
  const getMonacoApp = (): Option.Option<NonNullable<EditorAppExtended>> =>
    Option.fromNullable(wrapper.getMonacoEditorApp() as EditorAppExtended | undefined);

  return {
    wrapper,
    getEditor,
    getMonacoApp,
  };
});

export class TwinEditorService extends Context.Tag('editor/main/service')<
  TwinEditorService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(TwinEditorService, make);
}
