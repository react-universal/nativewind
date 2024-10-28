import generate from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { getAstTrees, getBabelAST } from '../utils/compiler.utils';

const make = {
  getAST: (code: string, filename: string) =>
    Effect.sync(() => getBabelAST(code, filename)),
  getJSXElementTrees: getAstTrees,
  buildFile: (ast: ParseResult<t.File>) =>
    Effect.sync(() =>
      pipe(
        Option.fromNullable(generate(ast)),
        Option.map((x) => x.code),
        Option.getOrNull,
      ),
    ),
};

export class BabelCompiler extends Context.Tag('babel/common/compiler')<
  BabelCompiler,
  typeof make
>() {
  static Live = Layer.succeed(BabelCompiler, make);
}
