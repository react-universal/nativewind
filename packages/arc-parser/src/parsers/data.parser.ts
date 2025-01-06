import { Parser, updateParserData, updateParserResult } from './Parser.js';

export const getData = new Parser((state) => {
  if (state.isError) return state;
  return updateParserResult(state, state.data);
});

export const setData = <Result, Data2>(data: Data2): Parser<Result, Data2> =>
  new Parser<Result, Data2>((state) => {
    if (state.isError) return state;
    return updateParserData<Result, any, Data2>(state, data);
  });

export function withData<Result>(
  parser: Parser<Result, any>,
): <Data>(data: Data) => Parser<Result, Data> {
  return (stateData) => setData<Result, any>(stateData).chain(() => parser);
}
