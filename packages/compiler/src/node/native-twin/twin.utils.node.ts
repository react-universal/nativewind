import generate from '@babel/generator';
import * as t from '@babel/types';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import * as Array from 'effect/Array';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as Predicate from 'effect/Predicate';
import * as Stream from 'effect/Stream';
import * as String from 'effect/String';
import fs from 'node:fs';
import path from 'node:path';
import { cx, defineConfig, RuntimeTW, TailwindConfig } from '@native-twin/core';
import {
  CompilerContext,
  compileSheetEntry,
  getGroupedEntries,
  RuntimeComponentEntry,
  sortSheetEntries,
} from '@native-twin/css/jsx';
import { DEFAULT_TWIN_INPUT_CSS_FILE, TWIN_DEFAULT_FILES } from '../../shared';
import { JSXElementNode, ReactCompilerService } from '../babel';
import { JSXMappedAttribute } from '../babel/models/jsx.models';
import { templateLiteralToStringLike } from '../babel/utils/babel.utils';
import {
  extractMappedAttributes,
  extractSheetsFromTree,
} from '../babel/utils/twin-jsx.utils';
import { maybeLoadJS } from '../utils';
import { NativeTwinServiceNode } from './NativeTwin.node';
import { InternalTwinConfig } from './twin.types';

const checkDefaultTwinConfigFiles = (rootDir: string) =>
  Effect.flatMap(FileSystem.FileSystem, (fs) =>
    Effect.firstSuccessOf(
      Array.map(TWIN_DEFAULT_FILES, (x) =>
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
        pipe(
          Array.map(TWIN_DEFAULT_FILES, (x) =>
            Option.liftPredicate(path.join(rootDir, x), fs.existsSync),
          ),
          Option.firstSomeOf,
        ),
    ),
    (x) => path.resolve(x),
  );

export const getTwinCacheDir = () =>
  path.join(path.dirname(require.resolve('@native-twin/core')), '.cache');

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
  if (!inputCSS) {
    inputCSS = path.join(outputDir, DEFAULT_TWIN_INPUT_CSS_FILE);
    fs.writeFileSync(inputCSS, '');
  }

  // fs.writeFileSync(outputCSS, '.tt_root { font-size: 16px }', 'utf-8');
  return {
    inputCSS,
  };
};

export const getFileClasses = (filename: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const twin = yield* NativeTwinServiceNode;
    const exists = yield* fs.exists(filename).pipe(
      Effect.mapError((x) => {
        console.log('getFileClasses_ERROR: ', x);
        return false;
      }),
    );
    const reactCompiler = yield* ReactCompilerService;

    if (!exists) {
      return {
        fileClasses: '',
        registry: HashMap.empty<string, JSXElementNode>(),
      };
    }

    const contents = yield* fs.readFileString(filename);

    if (contents === '') {
      return {
        fileClasses: '',
        registry: HashMap.empty<string, JSXElementNode>(),
      };
    }
    const filePath = path.relative(twin.projectRoot, filename);
    const babelTrees = yield* reactCompiler.getTrees(contents, filePath);

    const registry = yield* pipe(
      Stream.fromIterable(babelTrees),
      Stream.mapEffect((x) =>
        extractSheetsFromTree(x, path.relative(twin.projectRoot, filename)),
      ),
      Stream.map(HashMap.fromIterable),

      Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) => {
        return pipe(prev, HashMap.union(current));
      }),
    );

    const fileClasses = pipe(
      babelTrees,
      RA.flatMap((x) => x.all()),
      RA.flatMap((leave) => extractMappedAttributes(leave.value.babelNode)),
      RA.map(({ value }) => {
        let classNames = '';
        if (t.isStringLiteral(value)) {
          classNames = value.value;
        } else {
          const cooked = templateLiteralToStringLike(value);
          classNames = cooked.strings.replace('\n', ' ');
        }
        return cx(`${classNames.trim()}`);
      }),
      RA.join(' '),
    );

    return { fileClasses, registry };
  }).pipe(Effect.scoped);

export const getElementEntries = (
  props: JSXMappedAttribute[],
  twin: RuntimeTW,
  ctx: CompilerContext,
): RuntimeComponentEntry[] => {
  return pipe(
    props,
    RA.map(({ value, prop, target }): RuntimeComponentEntry => {
      let classNames = '';
      let templateExpression: null | string = null;
      if (t.isStringLiteral(value)) {
        classNames = value.value;
      } else {
        const cooked = templateLiteralToStringLike(value);
        classNames = cooked.strings;
        templateExpression = generate(cooked.expressions).code;
      }

      const entries = twin(classNames);
      const runtimeEntries = pipe(
        entries,
        RA.dedupeWith((a, b) => a.className === b.className),

        RA.map((x) => compileSheetEntry(x, ctx)),
        sortSheetEntries,
      );

      return {
        classNames,
        prop,
        target,
        templateLiteral: templateExpression,
        entries: runtimeEntries,
        templateEntries: [],
        // childEntries: pipe(
        //   runtimeEntries,
        //   RA.filter((x) => isChildEntry(x)),
        // ),
        rawSheet: getGroupedEntries(runtimeEntries),
      };
    }),
  );
};

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
