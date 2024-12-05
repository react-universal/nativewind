import { Data, Schema, type Option } from 'effect';
import { ts, OutputFile } from 'ts-morph';

export const tsHostFormatter: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export class BuildSource extends Data.Class<{
  path: string;
  content: string;
  sourcePath: string;
}> {}

export class BuildSourceWithMaps extends Data.Class<
  BuildSource & {
    sourcemap: Option.Option<string>;
    sourcemapPath: string;
  }
> {}

export interface CompilerOutput {
  readonly tsFile: BuildSource;
  readonly dtsFile: BuildSourceWithMaps;
  readonly esmFile: BuildSourceWithMaps;
  readonly annotatedESMFile: BuildSourceWithMaps;
  readonly cjsFile: BuildSourceWithMaps;
}

export const BabelSourceMapSchema = Schema.Struct({
  version: Schema.Number,
  sources: Schema.Array(Schema.String),
  names: Schema.Array(Schema.String),
  sourceRoot: Schema.String.pipe(Schema.optional),
  sourcesContent: Schema.Array(Schema.String).pipe(Schema.optional),
  mappings: Schema.String,
  file: Schema.String,
});

export interface BuildOutputFiles {
  esm: OutputFile;
  relativeSourcePath: string;
  sourcemaps: OutputFile;
  dts: OutputFile;
  dtsMap: OutputFile;
}
