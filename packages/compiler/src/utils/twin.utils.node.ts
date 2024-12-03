import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';
import * as String from 'effect/String';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { defineConfig, TailwindConfig } from '@native-twin/core';
import { InternalTwinConfig } from '../models/twin.types.js';
import { TWIN_DEFAULT_FILES } from '../shared/twin.constants.js';
import { maybeLoadJS } from './modules.utils.js';

const checkDefaultTwinConfigFiles = (rootDir: string) =>
  Effect.flatMap(FileSystem.FileSystem, (fs) =>
    Effect.firstSuccessOf(
      RA.map(TWIN_DEFAULT_FILES, (x) =>
        fs.exists(path.join(rootDir, x)).pipe(Effect.map(() => x)),
      ),
    ),
  );
export const resolveTwinConfigPath = (rootDir: string, twinConfigPath?: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const resolvedFile = yield* Effect.fromNullable(twinConfigPath).pipe(
      Effect.flatMap((x) => fs.exists(x).pipe(Effect.andThen(() => x))),
      Effect.catchAll(() => checkDefaultTwinConfigFiles(rootDir)),
      Effect.map((x) => path.resolve(x)),
    );
    return resolvedFile;
  });

export const getTwinConfigPath = (rootDir: string, twinConfigPath = '') =>
  Option.map(
    Option.orElse(
      Option.liftPredicate(
        twinConfigPath,
        Predicate.compose(Predicate.isString, String.isNonEmpty),
      ),
      () =>
        Option.firstSomeOf(
          RA.map(TWIN_DEFAULT_FILES, (x) =>
            Option.liftPredicate(path.join(rootDir, x), fs.existsSync),
          ),
        ),
    ),
    (x) => path.resolve(x),
  );

export const getTwinCacheDir = () => {
  const resolved = require.resolve('@native-twin/core');
  const dirname = path.dirname(resolved);
  return path.join(dirname, '.cache');
};

export const createTwinCSSFiles = ({
  outputDir,
  inputCSS,
}: {
  outputDir: string;
  inputCSS?: string;
}) => {
  if (!fs.existsSync(path.resolve(outputDir))) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (inputCSS) {
    if (!fs.existsSync(inputCSS)) {
      if (fs.existsSync(path.join(process.cwd(), inputCSS))) {
        inputCSS = path.join(process.cwd(), inputCSS);
      }
    }
  }

  // fs.writeFileSync(outputCSS, '.tt_root { font-size: 16px }', 'utf-8');
  return {
    inputCSS,
  };
};

// export const getFileClasses = (filename: string, forPlatform: string) =>
//   Effect.gen(function* () {
//     const fs = yield* FileSystem.FileSystem;
//     const twin = yield* TwinNodeContext;
//     const exists = yield* fs.exists(filename).pipe(
//       Effect.mapError((x) => {
//         console.log('getFileClasses_ERROR: ', x);
//         return false;
//       }),
//     );
//     const reactCompiler = yield* BabelCompiler;

//     if (!exists) {
//       return {
//         fileClasses: '',
//         registry: HashMap.empty<string, JSXElementNode>(),
//       };
//     }

//     const contents = yield* fs.readFileString(filename);

//     if (contents === '') {
//       return {
//         fileClasses: '',
//         registry: HashMap.empty<string, JSXElementNode>(),
//       };
//     }
//     const filePath = path.relative(twin.config.projectRoot, filename);
//     const babelTrees = yield* reactCompiler
//       .getAST(contents, filePath)
//       .pipe(Effect.flatMap((x) => reactCompiler.getJSXElementTrees(x, filename)));

//     const registry = yield* Stream.fromIterable(babelTrees).pipe(
//       Stream.mapEffect((x) =>
//         extractSheetsFromTree(
//           x,
//           path.relative(twin.config.projectRoot, filename),
//           forPlatform,
//         ),
//       ),
//       Stream.map(HashMap.fromIterable),
//       Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) =>
//         HashMap.union(current, prev),
//       ),
//     );

//     const fileClasses = pipe(
//       RA.flatMap(babelTrees, (x) => x.all()),
//       RA.flatMap((leave) => extractMappedAttributes(leave.value.babelNode)),
//       RA.map(({ value }) => {
//         let classNames = '';
//         if (t.isStringLiteral(value)) {
//           classNames = value.value;
//         } else {
//           const cooked = templateLiteralToStringLike(value);
//           classNames = cooked.strings.replace('\n', ' ');
//         }
//         return cx(`${classNames.trim()}`);
//       }),
//       RA.join(' '),
//     );

//     return { fileClasses, registry };
//   }).pipe(Effect.scoped);

export const loadUserTwinConfigFile = (
  projectRoot: string,
  twinConfigPath: string,
  mode: 'web' | 'native' = 'web',
) => {
  return getTwinConfigPath(projectRoot, twinConfigPath).pipe(
    Option.flatMap((x) => maybeLoadJS<TailwindConfig<InternalTwinConfig>>(x)),
    Option.getOrElse(() =>
      defineConfig({
        content: [],
        mode,
        root: { rem: 16 },
      }),
    ),
  );
};
