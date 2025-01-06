import { Parser, updateParserResult } from './Parser.js';

// either :: Parser e a s -> Parser e (Either e a) s
export const either = <A>(parser: Parser<A>): Parser<{ isError: boolean; value: A }> => {
  return new Parser((state) => {
    if (state.isError) return state;

    const nextState = parser.transform(state);

    return updateParserResult(
      { ...nextState, isError: false },
      {
        isError: nextState.isError,
        value: nextState.isError ? nextState.error : nextState.result,
      },
    );
  });
};
