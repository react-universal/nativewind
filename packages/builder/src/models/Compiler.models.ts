import { Data } from 'effect';
import type { Option } from 'effect';
import type { GlobOptions } from 'glob';
import ts from 'typescript';

export const tsHostFormatter: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export interface TsEmitSource {
  path: string;
  content: string;
}

export interface CompiledSource {
  readonly tsFile: {
    readonly path: string;
    readonly content: string;
  };
  readonly esmFile: {
    readonly sourcemapFilePath: string;
    readonly sourcemap: Option.Option<string>;
    readonly filePath: string;
    readonly output: ts.TranspileOutput;
  };
  readonly annotatedESMFile: {
    readonly sourcemap: Option.Option<BabelSourceMap>;
    readonly sourcemapFilePath: string;
    readonly filePath: string;
    readonly content: Option.Option<string>;
  };
  readonly cjsFile: {
    readonly sourcemap: Option.Option<BabelSourceMap>;
    readonly sourcemapFilePath: string;
    readonly filePath: string;
    readonly content: Option.Option<string>;
  };
}

export const getTsGlobOptions: GlobOptions = {
  nodir: true,
  absolute: true,
  cwd: process.cwd(),
  dotRelative: true,
  ignore: '**/*.d.ts',
};

export interface BabelSourceMap {
  version: number;
  sources: string[];
  names: string[];
  sourceRoot?: string | undefined;
  sourcesContent?: string[] | undefined;
  mappings: string;
  file: string;
}

export type TsEmitResult = Data.TaggedEnum<{
  File: { readonly value: TsEmitSource[]; original: TsEmitSource };
  Compiled: CompiledSource;
  Diagnostic: { readonly value: ts.Diagnostic; readonly filePath: string };
  Message: { readonly value: string };
}>;
export const TsEmitResult = Data.taggedEnum<TsEmitResult>();

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
  types: ['node', 'react-native'],
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
  noImplicitOverride: true,
  noErrorTruncation: false,
  noUnusedParameters: false,
  noUnusedLocals: true,
  isolatedModules: false,
};
