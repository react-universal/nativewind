import * as t from '@babel/types';
import * as Path from '@effect/platform/Path';
import * as CodeBlockWriter from 'code-block-writer';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import { js_beautify } from 'js-beautify';
import { getRawSheet } from '@native-twin/css/jsx';
import type { JSXElementNode } from '../models/JSXElement.model.js';
import { CompilerConfigContext } from '../services/CompilerConfig.service.js';
import { getJSXCompiledTreeRuntime, runtimeEntriesToAst } from './babel/babel.jsx.js';
import { entriesToComponentData } from './babel/code.utils.js';

interface JSXElementOutputData {
  stringEntries: string;
  astProps: t.Expression | null | undefined;
  node: JSXElementNode;
}
const getJSXElementOutput = (
  node: JSXElementNode,
  parent: Option.Option<JSXElementNode>,
): JSXElementOutputData => {
  const { leave } = getJSXCompiledTreeRuntime(node, parent);
  const stringEntries = entriesToComponentData(node.id, getRawSheet(leave.entries), true);
  const astProps = runtimeEntriesToAst(stringEntries);
  return {
    stringEntries,
    astProps,
    node,
  };
};

const getNativeFileOutput = (stringStyles: string, platform: string) =>
  Effect.gen(function* () {
    const writer = new CodeBlockWriter.default();
    const path = yield* Path.Path;
    const { env } = yield* CompilerConfigContext;

    writer.writeLine(`const setup = require('@native-twin/core').setup;`);
    writer.writeLine(`const runtimeTW = require('@native-twin/core').tw;`);
    writer.newLine();

    const outputFilePath =
      env.platformPaths[platform as 'native'] ?? env.platformPaths.native;

    let importTwinPath = path.relative(
      path.dirname(outputFilePath),
      env.twinConfigPath.pipe(Option.getOrElse(() => '')),
    );

    if (!importTwinPath.startsWith('.')) {
      importTwinPath = `./${importTwinPath}`;
    }

    writer.writeLine(`const twinConfig = require('${importTwinPath}');`);
    writer.writeLine(`setup(twinConfig);`);

    writer.write(stringStyles);
    // writer.write(stringStyles.replaceAll("require('@native-twin/jsx').", ''));
    return writer.toString();
  });

export const getNativeStylesJSOutput = (
  registry: HashMap.HashMap<string, JSXElementNode>,
  platform: string,
) =>
  Effect.gen(function* () {
    return yield* Stream.fromIterable(HashMap.values(registry)).pipe(
      Stream.map((node) =>
        getJSXElementOutput(
          node,
          Option.flatMap(node.parentID, (x) => HashMap.get(registry, x)),
        ),
      ),
      Stream.map((x) =>
        new CodeBlockWriter.default()
          .write(`['${x.node.id}']: `)
          .write(x.stringEntries)
          .write(',')
          .newLine()
          .toString(),
      ),
      Stream.runFold('', (current, prev) => {
        return `${current}${prev}`;
      }),
      Effect.map((x) => {
        const writer = new CodeBlockWriter.default();
        return writer
          .write(`export const globalSheets = `)
          .block(() => {
            writer.write(`${x}`);
          })
          .toString();
      }),
      Effect.flatMap((x) => getNativeFileOutput(x, platform)),
      Effect.map((x) =>
        js_beautify(x, {
          indent_char: ' ',
          // preserve_newlines: true,
          // keep_array_indentation: false,
          // break_chained_methods: false,
          brace_style: 'expand',
          unescape_strings: false,
          jslint_happy: true,
          end_with_newline: true,
          // indent_level: 2,
          // indent_size: 1,
          comma_first: false,
          e4x: false,
          // indent_empty_lines: false,
        }),
      ),
    );
  });
