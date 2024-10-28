import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import { Array, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import { PartialMessage, Plugin } from 'esbuild';
import { existsSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { BuilderLoggerService } from '../../../services/BuildLogger.service';
import { loggerUtils } from '../../../utils/logger';
import { DTSPluginOpts } from './plugins.types';
import { formatBytes, getCompilerOptions, resolveTSConfig } from './utils/dts.utils';

const scopeText = Doc.text(`[dts-plugin]`).pipe(
  Doc.annotate(Ansi.combine(Ansi.bold, loggerUtils.getMessageColor(LogLevel.Info))),
);

export const dtsPlugin = (opts: DTSPluginOpts = {}) =>
  Effect.gen(function* () {
    const logger = yield* BuilderLoggerService;
    return {
      name: 'dts-plugin',
      async setup(build) {
        const { config } = resolveTSConfig({
          configPath: opts.tsconfig,
        });

        const compilerOptions = getCompilerOptions({
          tsconfig: config,
          pluginOptions: opts,
          esbuildOptions: build.initialOptions,
        });

        const compilerHost = compilerOptions.incremental
          ? ts.createIncrementalCompilerHost(compilerOptions)
          : ts.createCompilerHost(compilerOptions);

        const inputFiles: string[] = [];

        build.onLoad({ filter: /(\.tsx|\.ts)$/ }, async (args) => {
          inputFiles.push(args.path);

          const errors: PartialMessage[] = [];

          compilerHost.getSourceFile(
            args.path,
            compilerOptions.target ?? ts.ScriptTarget.Latest,
            (m) => {
              errors.push({
                detail: m,
              });
            },
            true,
          );

          return {
            errors,
          };
        });

        build.onEnd(() => {
          let compilerProgram;
          if (compilerOptions.incremental) {
            compilerProgram = ts.createIncrementalProgram({
              options: compilerOptions,
              host: compilerHost,
              rootNames: inputFiles,
            });
          } else {
            compilerProgram = ts.createProgram(inputFiles, compilerOptions, compilerHost);
          }

          const diagnostics = ts.getPreEmitDiagnostics(compilerProgram as ts.Program).map(
            (d) =>
              ({
                text:
                  typeof d.messageText === 'string'
                    ? d.messageText
                    : d.messageText.messageText,
                detail: d,
                location: {
                  file: d.file?.fileName,
                  namespace: 'file',
                },
                category: d.category,
              }) satisfies PartialMessage & {
                category: ts.DiagnosticCategory;
              },
          );

          const errors = diagnostics
            .filter((d) => d.category === ts.DiagnosticCategory.Error)
            .map(({ category: _, ...message }) => message);

          const warnings = diagnostics
            .filter((d) => d.category === ts.DiagnosticCategory.Warning)
            .map(({ category: _, ...message }) => message);

          if (errors.length > 0) {
            return {
              errors,
              warnings,
            };
          }

          const startTime = Date.now();
          const emitResult = compilerProgram.emit();

          if (emitResult.emitSkipped || typeof emitResult.emittedFiles === 'undefined') {
            const noTypes = Doc.hsep([
              scopeText,
              Doc.text('No file was created on this build.'),
            ]).pipe(Doc.annotate(Ansi.combine(Ansi.bold, Ansi.yellow)));

            logger.log(loggerUtils.render(noTypes));

            return {
              warnings,
            };
          }

          const resultFiles = getEmittedResults(emitResult, compilerOptions);
          const hr = loggerUtils.createDashes(resultFiles.lineWidth + 40);

          const title = Doc.indent(
            Doc.hsep([
              scopeText,
              Doc.text(`(${build.initialOptions.format})`.toUpperCase()).pipe(
                Doc.annotate(Ansi.combine(Ansi.bold, Ansi.blue)),
              ),
              Doc.text(
                `Finished compiling declarations in ${Date.now() - startTime}ms`,
              ).pipe(Doc.annotate(Ansi.green)),
            ]),
            2,
          );
          const emittedTypes = Doc.vcat([
            hr,
            Doc.softLineBreak,
            title,
            Doc.indent(Doc.vsep(resultFiles.docs), 4),
            hr,
          ]);

          logger.log(loggerUtils.render(Doc.indent(emittedTypes, 2)));

          return {
            warnings,
          };
        });
      },
    } as Plugin;
  });

const getEmittedResults = (
  results: ts.EmitResult,
  compilerOptions: ts.CompilerOptions,
) => {
  if (!results.emittedFiles) {
    return {
      docs: [],
      lineWidth: 0,
    };
  }

  return pipe(
    Array.ensure(results.emittedFiles),
    Array.filter((file) => {
      const emittedPath = resolve(file);
      return existsSync(emittedPath) && emittedPath !== compilerOptions.tsBuildInfoFile;
    }),
    Array.map((file, index) => {
      const emittedPath = resolve(file);
      const stat = lstatSync(emittedPath);

      const pathFromContentRoot = emittedPath
        .replace(resolve(process.cwd()), '')
        .replace(/^[\\/]/, '');
      const humanFileSize = formatBytes(stat.size);

      const text = `${pathFromContentRoot} ${humanFileSize}`;

      const listSymbol = Doc.char(
        index + 1 === results.emittedFiles?.length ? '\u{2514}' : '\u{251C}',
      );
      const doc = Doc.hsep([listSymbol, Doc.text(pathFromContentRoot)]);
      return {
        doc,
        size: Doc.text(humanFileSize).pipe(Doc.annotate(Ansi.green)),
        lineWidth: text.length,
      };
    }),
    (docs) => {
      const lineWidth = Array.reduce(docs, 0, (prev, current) => {
        return prev > current.lineWidth ? prev : current.lineWidth;
      });
      const newDocs = docs.map((x) =>
        Doc.hsep([loggerUtils.printKeyValuePair(x.doc, x.size, lineWidth)]),
      );
      return {
        docs: newDocs,
        lineWidth: lineWidth,
      };
    },
  );
};
