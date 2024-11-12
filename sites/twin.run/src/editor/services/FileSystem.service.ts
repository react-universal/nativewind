import { GetPackageTypings } from '@/utils/twin.schemas';
import { TwinTyping } from '@/utils/twin.schemas';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as monaco from 'monaco-editor';

interface RegisteredTyping {
  disposable: monaco.IDisposable;
  model: monaco.editor.ITextModel;
}
export class FileSystemService extends Context.Tag('editor/files/FileSystemService')<
  FileSystemService,
  {
    getFileByURI: (uri: monaco.Uri) => Option.Option<monaco.editor.ITextModel>;
    createModel: (uri: monaco.Uri, contents: string) => monaco.editor.ITextModel;
    getOrCreate: (filePath: string, contents?: string) => monaco.editor.ITextModel;
    getEditorFiles: () => monaco.editor.ITextModel[];
    pathToMonacoURI: (path: string) => monaco.Uri;
    registerTypings: (typing: TwinTyping) => Effect.Effect<RegisteredTyping>;
    twinTypings: GetPackageTypings[];
  }
>() {
  static Live = Layer.scoped(
    FileSystemService,
    Effect.gen(function* () {
      const workspacePrefix = 'file:///';

      const detectLanguage = (path: string) => {
        const ext = path.replace(/^.+\.([^.]+)$/, '$1');
        if (/^[cm]?[jt]sx?$/.test(ext)) {
          return 'typescript';
        }

        return ext;
      };

      const getFileByURI = (uri: monaco.Uri) =>
        pipe(monaco.editor.getModel(uri), Option.fromNullable);

      const createModel = (uri: monaco.Uri, contents: string) =>
        monaco.editor.createModel(
          contents,
          detectLanguage(uri.path) ?? 'typescript',
          uri,
        );

      const pathToMonacoURI = (path: string) =>
        monaco.Uri.parse(new URL(path, workspacePrefix).href);

      return {
        twinTypings,
        getFileByURI,
        createModel,
        getEditorFiles: monaco.editor.getModels,
        pathToMonacoURI,
        getOrCreate: (filePath: string, contents: string = '') => {
          const uri = pathToMonacoURI(filePath);
          return pipe(
            getFileByURI(uri),
            Option.getOrElse(() => createModel(uri, contents)),
          );
        },
        registerTypings: (typing: TwinTyping) =>
          Effect.sync(() => ({
            disposable: monaco.languages.typescript.typescriptDefaults.addExtraLib(
              typing.contents,
              typing.filePath,
            ),
            model: createModel(pathToMonacoURI(typing.filePath), typing.contents),
          })),
      };
    }),
  );
}

const twinTypings = [
  new GetPackageTypings({
    name: '@native-twin/core',
    version: '6.4.0',
  }),
  new GetPackageTypings({
    name: '@native-twin/css',
    version: '6.4.0',
  }),
  new GetPackageTypings({
    name: '@native-twin/preset-tailwind',
    version: '6.4.0',
  }),
  new GetPackageTypings({
    name: '@native-twin/arc-parser',
    version: '6.4.0',
  }),
  new GetPackageTypings({
    name: '@native-twin/helpers',
    version: '6.4.0',
  }),
];
