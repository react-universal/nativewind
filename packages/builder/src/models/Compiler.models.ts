import { BabelFileMetadata, BabelFile } from '@babel/core';
import { Option, Schema } from 'effect';
import { OutputFile, ts } from 'ts-morph';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };

export const tsHostFormatter: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export interface BuildSource {
  path: string;
  content: string;
  sourcePath: string;
}
export interface BuildSourceWithMaps extends BuildSource {
  sourcemap: Option.Option<string>;
  sourcemapPath: string;
}

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

export type BabelSourceMapSchemaType = DeepWriteable<
  (typeof BabelSourceMapSchema)['Type']
>;

export interface BabelTranspilerResult {
  code: string;
  map: Option.Option<string>;
  ast?: BabelFile['ast'] | null | undefined;
  ignored?: boolean | undefined;
  metadata?: BabelFileMetadata | undefined;
}

export interface BuildOutputFiles {
  esm: OutputFile;
  relativeSourcePath: string;
  sourcemaps: OutputFile;
  dts: OutputFile;
  dtsMap: OutputFile;
}

// export interface BabelOutputFiles {
//   cjs: BuildSourceWithMaps;
//   esm: BuildSourceWithMaps;
//   dts: OutputFile;
//   dtsMap: OutputFile;
//   relativeSourcePath: string;
// }
