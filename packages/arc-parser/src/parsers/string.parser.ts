import { Parser, updateParserError, updateParserState } from './Parser.js';
import { maybe } from './maybe.parser.js';

export const char = (cs: string): Parser<string> =>
  new Parser((state) => {
    if (state.isError) return state;

    const sliced = state.target.slice(state.cursor, state.cursor + 1);
    if (sliced === cs) {
      return updateParserState(state, sliced, state.cursor + 1);
    }
    return updateParserError(
      state,
      `Char: Parser error, expected char ${cs} but got ${sliced}`,
    );
  });

export const literal = <A extends string>(cs: A): Parser<A> =>
  new Parser((state) => {
    if (state.isError) return state;

    const { cursor, target } = state;

    if (state.target[cursor] === cs[0]) {
      const sliced = target.slice(cursor, cursor + cs.length);
      if (sliced === cs) {
        return updateParserState(state, sliced, cursor + cs.length);
      }
    }
    return updateParserError(
      state,
      `Literal: Parser error, expected string ${cs} but got ${target.slice(
        cursor,
        cursor + 5,
      )}`,
    );
  });

const regexLetters = /^[a-zA-Z]+/;
const regexAnyLetter = /^[a-zA-Z]/;

export const regex = (re: RegExp): Parser<string> =>
  new Parser((state) => {
    if (state.isError) return state;

    const { cursor, target } = state;
    const sliced = target.slice(cursor);
    const match = sliced.match(re);
    if (!match) {
      return updateParserError(
        state,
        `ParserError: regex could not match any char at: ${cursor}, got: ${target.slice(
          cursor,
          cursor + 5,
        )}`,
      );
    }
    return updateParserState(state, match[0], cursor + match[0].length);
  });

export const letters: Parser<string> = regex(regexLetters);
export const anyLetter: Parser<string> = regex(regexAnyLetter);

const regexWhiteSpace = /^\s+/;
export const whitespace: Parser<string> = regex(regexWhiteSpace);

export const orEmptyString = <T>(parser: Parser<T>) => maybe(parser).map((x) => x || '');

export const everyCharUntil = (char: string): Parser<string> =>
  new Parser((state) => {
    if (state.isError) return state;

    const { cursor, target } = state;
    const sliced = target.slice(cursor);
    const nextIndex = sliced.indexOf(char);
    return updateParserState(state, sliced.slice(0, nextIndex), cursor + nextIndex);
  });

export const optionalWhitespace = maybe(whitespace).map((x) => x || '');

export const startOfInput = new Parser<null>((state) => {
  if (state.isError) return state;

  const { cursor } = state;
  if (cursor > 0) {
    return updateParserError(
      state,
      `ParseError 'startOfInput': Expected start of input'`,
    );
  }

  return state;
});

export const anythingExcept = function anythingExcept(
  parser: Parser<any>,
): Parser<number> {
  return new Parser(function anythingExcept$state(state) {
    if (state.isError) return state;
    const { target, cursor } = state;

    const out = parser.transform(state);
    if (out.isError) {
      return updateParserState(state, target.slice(cursor, cursor + 1), cursor + 1);
    }

    return updateParserError(
      state,
      `ParseError 'anythingExcept' (position ${cursor}): Matched '${out.result}' from the exception parser`,
    );
  });
};
