import { Path } from '@effect/platform';
import {
  Context,
  Effect,
  Layer,
  Option,
  Queue,
  Array as RA,
  Stream,
  Tuple,
  pipe,
} from 'effect';
import { type Diagnostic, type OutputFile, Project, type SourceFile } from 'ts-morph';
import type { BuildOutputFiles } from '../models/Compiler.models';
import { TSCompilerOptions } from '../models/TSCompiler.model';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const diagnostics = yield* Queue.unbounded<Diagnostic>();
  const fileEmitter =
    yield* Queue.unbounded<[sourceFile: SourceFile, outputFiles: BuildOutputFiles]>();
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;
  const compiler = new Project({
    tsConfigFilePath: path_.join(process.cwd(), 'tsconfig.build.json'),
    compilerOptions: TSCompilerOptions,
  });
  const fs = compiler.getFileSystem();

  const sourceFiles = yield* getProjectFiles();

  const tsBuild = Stream.fromIterable(compiler.getSourceFiles()).pipe(
    // Stream.tap((x) => Effect.logDebug('Before emit outputs', x.getFilePath())),
    Stream.mapEffect(getSourceOutputs),
    // Stream.tap(() => Effect.logDebug('After emit outputs')),
  );

  const tsWatch = pipe(
    yield* fsUtils.createWatcher(RA.dedupe(sourceFiles.map((x) => path_.dirname(x)))),
    Stream.tap((x) =>
      Effect.logDebug(
        `[watcher] Detected ${x._tag} change in: ${x.path.replace(process.cwd(), '')}`,
      ),
    ),
    Stream.filterEffect((event) =>
      Effect.gen(function* () {
        if (event._tag === 'Remove') return false;
        if (event._tag === 'Create') yield* addFile(event.path);
        if (event._tag === 'Update') yield* refreshFileAt(event.path);
        return true;
      }),
    ),
    Stream.filterMap((x) => getFileAt(x.path)),
    Stream.mapEffect(getSourceOutputs),
    Stream.filterMap((x) =>
      Option.flatMap(x[1], (files) => Option.some(Tuple.make(x[0], files))),
    ),
  );

  yield* Queue.take(diagnostics).pipe(
    Effect.tap((diagnostic) =>
      Effect.logWarning({
        code: diagnostic.getCode(),
        category: diagnostic.getCategory(),
        message: diagnostic.getMessageText(),
        source: diagnostic.getSource(),
        file: diagnostic.getSourceFile()?.getFilePath(),
      }),
    ),
    Effect.forever,
    Effect.fork,
  );

  yield* sendDiagnostics(...compiler.getPreEmitDiagnostics());

  return {
    tsBuild,
    tsWatch,
    fileEmitter,
    sendDiagnostics,
    compiler,
    writeFile,
    diagnostics,
  };

  function sendDiagnostics(...data: Diagnostic[]) {
    return Queue.offerAll(diagnostics, data);
  }

  function getSourceOutputs(source: SourceFile) {
    return Effect.sync(() => source.getEmitOutput()).pipe(
      Effect.map((x) => Tuple.make(source, mapToCompilerOutput(x.getOutputFiles()))),
      // Effect.tap(() => Effect.logDebug('Source output emitted')),
    );
  }

  function getFileAt(path: string) {
    return Option.fromNullable(compiler.getSourceFile(path));
  }

  function refreshFile(file: SourceFile) {
    return Effect.promise(() => file.refreshFromFileSystem()).pipe(
      Effect.flatMap(() => getFileAt(file.getFilePath())),
    );
  }

  function refreshFileAt(path: string) {
    return getFileAt(path).pipe(Effect.flatMap((x) => refreshFile(x)));
  }

  function getProjectFiles() {
    return Effect.promise(() => fs.glob(['src/**/*.ts'])).pipe(
      Effect.map((path) => path.filter((x) => !x.endsWith('.d.ts'))),
    );
  }

  function addFile(path: string) {
    return Effect.sync(() => compiler.addSourceFileAtPathIfExists(path));
  }

  function writeFile(path: string, content: string) {
    return Effect.promise(() => fs.writeFile(path, content));
  }

  function mapToCompilerOutput(files: OutputFile[]): Option.Option<BuildOutputFiles> {
    return Option.Do.pipe(
      Option.bind('esm', () =>
        RA.findFirst(files, (x) => x.getFilePath().endsWith('.js')),
      ),
      Option.let('sourcePath', ({ esm }) =>
        fsUtils.getOriginalSourceForESM(esm.getFilePath()),
      ),
      Option.let('relativeSourcePath', ({ esm, sourcePath }) =>
        path_.relative(path_.dirname(esm.getFilePath()), sourcePath),
      ),
      Option.bind('sourcemaps', () =>
        RA.findFirst(files, (x) => x.getFilePath().endsWith('.js.map')),
      ),
      Option.bind('dts', () =>
        RA.findFirst(files, (x) => x.getFilePath().endsWith('.d.ts')),
      ),
      Option.bind('dtsMap', () =>
        RA.findFirst(files, (x) => x.getFilePath().endsWith('.d.ts.map')),
      ),
    );
  }
});

export interface TypescriptContext extends Effect.Effect.Success<typeof make> {}
export const TypescriptContext =
  Context.GenericTag<TypescriptContext>('TypescriptContext');
export const TypescriptContextLive = Layer.effect(TypescriptContext, make).pipe(
  Layer.provide(FsUtilsLive),
);
