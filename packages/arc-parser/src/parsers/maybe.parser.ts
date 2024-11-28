import { Parser, updateParserResult } from './Parser.js';

export function maybe<T>(parser: Parser<T>): Parser<T | null> {
  return new Parser((state) => {
    if (state.isError) return state;

    const nextState = parser.transform(state);
    return nextState.isError ? updateParserResult(state, null) : nextState;
  });
}
