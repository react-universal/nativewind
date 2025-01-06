import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import {
  identifierIsReactImport,
  memberExpressionIsReactImport,
} from '../utils/babel/babel.utils.js';

const make = Effect.gen(function* () {
  return yield* Effect.succeed({
    memberExpressionIsReactImport,
    identifierIsReactImport,
  } as const);
});

/** CONTEXT */

export interface BabelCompilerContext extends Effect.Effect.Success<typeof make> {}
export const BabelCompilerContext = Context.GenericTag<BabelCompilerContext>(
  'babel/common/compiler',
);

export const BabelCompilerContextLive = Layer.effect(BabelCompilerContext, make);
