import type { ParserState } from '../types.js';
import { Parser, updateParserResult } from './Parser.js';

export const separatedBy =
  <S, Data>(separatorParser: Parser<S, Data>) =>
  <T>(valueParser: Parser<T>) => {
    return new Parser<T[]>((state) => {
      if (state.isError) return state;

      let nextState: ParserState<S | T, Data> = state;
      let error = null;
      const results: T[] = [];

      while (true) {
        const valState = valueParser.transform(nextState);
        const sepState = separatorParser.transform(valState);

        if (valState.isError) {
          error = valState;
          break;
        } else {
          results.push(valState.result);
        }

        if (sepState.isError) {
          nextState = valState;
          break;
        }

        nextState = sepState;
      }

      if (error) {
        if (results.length === 0) {
          return updateParserResult(state, results) as ParserState<T[], Data>;
        }
        return error;
      }

      return updateParserResult(nextState, results);
    });
  };
