import { Array, Effect, Option } from 'effect';
import path from 'node:path';
import { FileSystemHost, ts, MemoryEmitResultFile, Project, SourceFile } from 'ts-morph';

export class TSCompiler {
  private readonly compiler: Project;
  private readonly fs: FileSystemHost;

  constructor() {
    this.compiler = new Project({
      tsConfigFilePath: path.join(process.cwd(), 'tsconfig.build.json'),
      compilerOptions: TSCompilerOptions,
      // useInMemoryFileSystem: true,
      // skipAddingFilesFromTsConfig: true,
    });
    this.fs = this.compiler.getFileSystem();
  }

  emit(sourceFile: SourceFile | undefined = undefined) {
    return Effect.try(() =>
      this.compiler.emitToMemory({
        targetSourceFile: sourceFile,
      }),
    );
  }

  getFileAt(path: string) {
    return Effect.try(() => this.compiler.getSourceFileOrThrow(path));
  }

  refreshFile(file: SourceFile) {
    return Effect.promise(() => file.refreshFromFileSystem()).pipe(
      Effect.flatMap(() => this.getFileAt(file.getFilePath())),
    );
  }

  refreshFileAt(path: string) {
    return this.getFileAt(path).pipe(Effect.flatMap((x) => this.refreshFile(x)));
  }

  getProjectFiles() {
    return Effect.promise(() => this.fs.glob(['src/**/*.ts']));
  }

  readyDir(path: string) {
    return Effect.try(() => this.fs.readDirSync(path));
  }

  rmFile(path: string) {
    return Effect.promise(() => this.fs.delete(path));
  }

  addFile(path: string) {
    return Effect.sync(() => this.compiler.addSourceFileAtPathIfExists(path));
  }

  fileExists(path: string) {
    return Effect.promise(() => this.fs.fileExists(path));
  }

  getEmitOriginalSource(path: string) {
    return path.replace('/build/esm/', '/src/').replace(/.js$/, '.ts');
  }

  writeFile(path: string, content: string) {
    return Effect.promise(() => this.fs.writeFile(path, content));
  }

  resolveEmittedFile(files: MemoryEmitResultFile[]) {
    return Option.Do.pipe(
      Option.bind('esm', () =>
        Array.findFirst(files, (x) => x.filePath.endsWith('.js')).pipe(
          Option.map((x) => ({
            path: x.filePath,
            content: x.text,
          })),
        ),
      ),
      Option.let('sourcePath', ({ esm }) => this.getEmitOriginalSource(esm.path)),
      Option.let('relativeSourcePath', ({ esm, sourcePath }) =>
        path.relative(path.dirname(esm.path), sourcePath),
      ),
      Option.bind('sourcemaps', () =>
        Array.findFirst(files, (x) => x.filePath.endsWith('.js.map')).pipe(
          Option.map((x) => ({
            path: x.filePath,
            content: x.text,
          })),
        ),
      ),
      Option.bind('dts', () =>
        Array.findFirst(files, (x) => x.filePath.endsWith('.d.ts')).pipe(
          Option.map((x) => ({
            path: x.filePath,
            content: x.text,
          })),
        ),
      ),
      Option.bind('dtsMap', () =>
        Array.findFirst(files, (x) => x.filePath.endsWith('.d.ts.map')).pipe(
          Option.map((x) => ({
            path: x.filePath,
            content: x.text,
          })),
        ),
      ),
    );
  }
}

export const TSCompilerOptions: ts.CompilerOptions = {
  declaration: true,
  sourceMap: true,
  declarationMap: true,
  emitDecoratorMetadata: true,
  experimentalDecorators: true,
  noEmitOnError: true,
  downlevelIteration: true,
  removeComments: false,
  jsx: ts.JsxEmit.ReactNative,
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  moduleDetection: ts.ModuleDetectionKind.Force,
  esModuleInterop: false,
  stripInternal: false,
  types: ['node', 'react-native', 'jest'],
  skipLibCheck: true,
  skipDefaultLibCheck: true,
  allowSyntheticDefaultImports: true,
  resolveJsonModule: true,
  allowJs: false,
  checkJs: false,
  strict: true,
  strictFunctionTypes: true,
  noFallthroughCasesInSwitch: true,
  noPropertyAccessFromIndexSignature: true,
  strictNullChecks: true,
  noUncheckedIndexedAccess: false,
  alwaysStrict: true,
  forceConsistentCasingInFileNames: true,
  allowUnreachableCode: false,
  noImplicitReturns: false,
  exactOptionalPropertyTypes: false,
  noImplicitAny: true,
  noImplicitThis: true,
  noImplicitOverride: false,
  noErrorTruncation: false,
  noUnusedParameters: false,
  noUnusedLocals: true,
  isolatedModules: false,
  outDir: './build/esm',
  declarationDir: './build/dts',
};
