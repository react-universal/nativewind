import { Effect, LogLevel, Logger, Option } from 'effect';
import { describe, expect, it } from 'vitest';
import { FSUtils, TwinFileContext, TwinPath } from '../src';
import { TestRuntime } from './test.utils';

describe.only('Babel Compiler', () => {
  it('Test Compile code', async () => {
    await Effect.gen(function* () {
      const { getTwinFile, collectTwinElements, compileTwinElement, transformFile } =
        yield* TwinFileContext;
      const twinPath = yield* TwinPath.TwinPath;
      const fs = yield* FSUtils.FsUtils;
      const twinFile = yield* getTwinFile(
        twinPath.make.absoluteFromString('fixtures/twin-compiler/code.tsx'),
        Option.none(),
      );

      const output = yield* transformFile(twinFile, 'ios');
      if (Option.isNone(output)) {
        return expect.fail('cant transform file');
      }

      const outputPath = twinPath.make.absoluteFromString(
        'fixtures/twin-compiler/code.out.tsx',
      );
      yield* fs.writeFileSource({
        path: outputPath,
        content: output.value.code,
      });

      const outFileContent = yield* fs.readFile(outputPath);
      expect(outFileContent).toStrictEqual(output.value.code);

      // yield* Stream.fromIterableEffect(twinFile.getBabelTwinElements()).pipe(
      //   Stream.mapEffect((twinEl) => compileTwinElement(twinEl, 'ios')),
      //   Stream.runForEach((result) => flattenElementInfo(result)),
      //   Effect.andThen(() =>
      //     Effect.gen(function* () {
      //       const output = yield* twinFile.generateCode(twinFile.ast);
      //       if (!output?.code) {
      //         return Effect.logError('cant compile file');
      //       }
      //       yield* fs.writeFileSource({
      //         path: twinPath.make.absoluteFromString(
      //           'fixtures/twin-compiler/code.out.tsx',
      //         ),
      //         content: output.code,
      //       });
      //     }),
      //   ),
      // );
    }).pipe(
      Effect.provide(TwinFileContext.Default),
      Logger.withMinimumLogLevel(LogLevel.All),
      TestRuntime.runPromise,
    );
    expect(true).toBeTruthy();
  });
});

// const getElementLogInfo = (twinEl: TwinCompiledElement) => {
//   return {
//     name: twinEl.babel.jsxName.pipe(
//       Option.map((x) => x.name),
//       Option.getOrNull,
//     ),
//     index: twinEl.babel.index,
//     inheritedClasses: Array.fromIterable(
//       Iterable.flatMap(twinEl.props, (x) => x.entries),
//     ).map((x) => ({
//       inherited: x.inherited,
//       className: x.className,
//       declarations: x.runtimeDeclarations,
//     })),
//     sheet: Array.fromIterable(Iterable.flatMap(twinEl.props, (x) => x.entries)).map(
//       (x) => x.styles,
//     ),
//   };
// };

// const flattenElementInfo = (result: TwinCompiledElement): Effect.Effect<void> => {
//   return Console.withGroup(
//     Effect.gen(function* () {
//       yield* Effect.logDebug('CODE: ', result.runtimeEntriesToCode());
//       yield* Effect.log(getElementLogInfo(result));
//       yield* Effect.log(
//         'CHILDS: ',
//         Array.fromIterable(result.childs).map((x) => getElementLogInfo(x)),
//       );
//       yield* Effect.log('\n');
//       yield* Effect.all(
//         Iterable.map(result.childs, (child) => flattenElementInfo(child)),
//         {
//           concurrency: 'inherit',
//         },
//       );
//       result.mutateBabelAST();
//     }),
//     {
//       label: result.babel.jsxName.pipe(
//         Option.map((x) => x.name),
//         Option.getOrElse(() => 'Unknown'),
//       ),
//       collapsed: false,
//     },
//   );
// };
