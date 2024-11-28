import { Parser, updateParserResult, updateParserError } from './Parser.js';

export const many = <A>(parser: Parser<A>): Parser<A[]> => {
  return new Parser((state) => {
    if (state.isError) return state;

    const results = [];
    let nextState = state;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const out = parser.transform(nextState);

      if (out.isError) {
        break;
      } else {
        nextState = out;
        results.push(nextState.result);
        if (nextState.cursor >= state.target.length) {
          break;
        }
      }
    }
    return updateParserResult(nextState, results);
  });
};

export const many1 = <A>(parser: Parser<A>): Parser<A[]> => {
  return new Parser((state) => {
    if (state.isError) return state;

    const response = many(parser).transform(state);
    if (response.result.length > 0) {
      return response;
    }
    return updateParserError(
      state,
      `Many: does not have any result at position ${state.cursor} ${state.target.slice(
        state.cursor,
        5,
      )}`,
    );
  });
};
