import { Parser, updateParserResult } from './Parser.js';

export const skip = (parser: Parser<any>): Parser<null> => {
  return new Parser((state) => {
    if (state.isError) return state;

    const nextState = parser.transform(state);
    if (nextState.isError) return nextState;

    return updateParserResult(nextState, state.result);
  });
};
