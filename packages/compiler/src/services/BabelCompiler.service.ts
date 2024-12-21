import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import {
  identifierIsReactImport,
  memberExpressionIsReactImport,
} from '../utils/babel/babel.utils.js';

const make = Effect.gen(function* () {
  return {
    memberExpressionIsReactImport,
    identifierIsReactImport,
    mutateAST: (ast: ParseResult<t.File>) =>
      Effect.sync(() => {
        const generate = new CodeGenerator(ast);
        return Option.fromNullable(generate.generate()).pipe(Option.getOrNull);
      }),
  } as const;
});

/** CONTEXT */

export interface BabelCompilerContext extends Effect.Effect.Success<typeof make> {}
export const BabelCompilerContext = Context.GenericTag<BabelCompilerContext>(
  'babel/common/compiler',
);

export const BabelCompilerContextLive = Layer.effect(BabelCompilerContext, make);
