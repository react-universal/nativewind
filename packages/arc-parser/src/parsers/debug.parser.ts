import type { ParserState } from '../types.js';
import { Parser } from './Parser.js';

export const tapParser = <Result, Data>(
  fn: (state: ParserState<Result, Data>) => void,
): Parser<Result, Data> =>
  new Parser((state) => {
    fn(state);
    return state;
  });

export const debugState = <T>(expected: string, msg: string): Parser<T> => {
  return tapParser((state) => {
    // eslint-disable-next-line no-console
    console.debug(`TAP \n Message: (${msg}) expected: ("${expected}")`, '\n', state);
  });
};
