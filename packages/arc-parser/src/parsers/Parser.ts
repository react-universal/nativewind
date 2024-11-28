import type {
  ResultType,
  StateTransformerFunction,
  ParserError,
  ParserState,
  ParserSuccess,
} from '../types.js';

export class Parser<Result, Data = any> {
  transform: StateTransformerFunction<Result, Data>;
  constructor(transform: StateTransformerFunction<Result, Data>) {
    this.transform = transform;
  }

  run(target: string): ResultType<Result, Data> {
    const state = createParserState(target);

    const resultState = this.transform(state);

    if (resultState.isError) {
      return {
        isError: true,
        error: resultState.error,
        cursor: resultState.cursor,
        data: resultState.data,
      };
    }

    return {
      isError: false,
      result: resultState.result,
      cursor: resultState.cursor,
      data: resultState.data,
    };
  }

  map<Result2>(fn: (x: Result) => Result2): Parser<Result2, Data> {
    const parser = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = parser(state);
      if (newState.isError) return newState as unknown as ParserState<Result2, Data>;
      return updateParserResult(newState, fn(newState.result));
    });
  }

  mapFromState<Result2>(
    fn: (x: ParserState<Result, Data>, initialIndex: number) => Result2,
  ): Parser<Result2, Data> {
    const parser = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = parser(state);
      if (newState.isError) return newState as unknown as ParserState<Result2, Data>;
      return updateParserResult(newState, fn(newState, state.cursor));
    });
  }

  chain<Result2>(fn: (x: Result) => Parser<Result2>): Parser<Result2, Data> {
    const p = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = p(state);
      if (newState.isError) return newState as unknown as ParserState<Result2, Data>;
      return fn(newState.result).transform(newState);
    });
  }

  errorMap(fn: (error: ParserError<Data>) => string): Parser<Result, Data> {
    const p = this.transform;
    return new Parser((state): ParserState<Result, Data> => {
      const nextState = p(state);
      if (!nextState.isError) return nextState as unknown as ParserState<Result, Data>;

      return updateParserError(
        nextState,
        fn({
          isError: true,
          error: nextState.error,
          cursor: nextState.cursor,
          data: nextState.data,
        }),
      );
    });
  }

  errorChain<Result2, Data2>(
    fn: (error: ParserError<Data>) => Parser<Result2, Data2>,
  ): Parser<Result2, Data2> {
    const p = this.transform;
    return new Parser((state): ParserState<Result2, Data2> => {
      const nextState = p(state);
      if (nextState.isError) {
        const { error, cursor, data } = nextState;
        const nextParser = fn({ isError: true, error, cursor, data });
        return nextParser.transform({ ...nextState, isError: false });
      }
      return nextState as unknown as ParserState<Result2, Data2>;
    });
  }

  mapFromData<Result2>(
    fn: (data: ParserSuccess<Result, Data>) => Result2,
  ): Parser<Result2, Data> {
    const p = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = p(state);
      if (newState.isError && newState.error)
        return newState as unknown as ParserState<Result2, Data>;
      return updateParserResult(
        newState,
        fn({
          isError: false,
          result: newState.result,
          data: newState.data,
          cursor: newState.cursor,
        }),
      );
    });
  }

  chainFromData<Result2>(
    fn: (data: { result: Result; data: Data }) => Parser<Result2, Data>,
  ): Parser<Result2, Data> {
    const p = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = p(state);
      if (newState.isError && newState.error)
        return newState as unknown as ParserState<Result2, Data>;
      return fn({ result: newState.result, data: newState.data }).transform(newState);
    });
  }

  mapData<Data2>(fn: (data: Data) => Data2): Parser<Result, Data2> {
    const p = this.transform;
    return new Parser((state) => {
      const newState = p(state);
      return updateParserData(newState, fn(newState.data));
    });
  }

  fork<F>(
    target: string,
    data: Data,
    errorFn: (errorMsg: string | null, parserState: ParserState<Result, Data>) => F,
    successFn: (result: Result, parserState: ParserState<Result, Data>) => F,
  ) {
    const state = createParserState(target, data);
    const newState = this.transform(state);

    if (newState.isError) return errorFn(newState.error, newState);
    return successFn(newState.result, newState);
  }

  apply<Result2>(fn: (x?: Result) => Parser<Result2, Data>): Parser<Result2, Data> {
    const transform = this.transform;
    return new Parser((state): ParserState<Result2, Data> => {
      const newState = transform(state);
      if (newState.isError) return newState as unknown as ParserState<Result2, Data>;
      return fn(newState.result).transform(newState);
    });
  }

  static of<Result, Data = null>(x: Result): Parser<Result, Data> {
    return new Parser((state) => updateParserResult(state, x));
  }
}
export const updateParserError = <Result, Data>(
  state: ParserState<Result, Data>,
  error: string,
): ParserState<Result, Data> => ({ ...state, isError: true, error });
export const updateParserResult = <Result, Result2, Data>(
  state: ParserState<Result, Data>,
  result: Result2,
): ParserState<Result2, Data> => ({ ...state, result });
export const updateParserState = <Result, Result2, Data>(
  state: ParserState<Result, Data>,
  result: Result2,
  cursor: number,
): ParserState<Result2, Data> => ({
  ...state,
  result,
  cursor,
});
export const createParserState = <Data>(
  target: string,
  data: Data | null = null,
): ParserState<null, Data | null> => {
  return {
    target,
    isError: false,
    error: null,
    result: null,
    cursor: 0,
    data,
  };
};

export const updateParserData = <Result, Data, Data2>(
  state: ParserState<Result, Data>,
  data: Data2,
): ParserState<Result, Data2> => ({ ...state, data });
