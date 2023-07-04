import { Parser, updateParserData, updateParserResult } from '../Parser';

export const getData = new Parser((state) => {
  if (state.isError) return state;
  return updateParserResult(state, state.data);
});

export const setData = <Result, ErrorResult, Data2>(
  data: Data2,
): Parser<Result, ErrorResult, Data2> =>
  new Parser((state) => {
    if (state.isError) return state;
    return updateParserData<Result, ErrorResult, any, Data2>(state, data);
  });

export const withData =
  <Result, ErrorResult, Data>(
    parser: Parser<Result, ErrorResult, any>,
  ): ((data: Data) => Parser<Result, ErrorResult, Data>) =>
  (stateData) =>
    setData<Result, ErrorResult, any>(stateData).chain(() => parser);