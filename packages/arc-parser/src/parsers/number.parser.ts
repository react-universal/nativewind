import type { Parser } from './Parser.js';
import { choice } from './choice.parser.js';
import { many1 } from './many.parser.js';
import { char, letters, regex, whitespace } from './string.parser.js';

const regexDigits = /^[0-9]+/;

export const digits: Parser<string> = regex(regexDigits);
export const plusOrMinus = choice([char('+'), char('-')]);

export const float = many1(choice([plusOrMinus, digits, char('.')])).map((x) =>
  x.join(''),
);

export const alphanumeric: Parser<string> = many1(
  choice([letters, digits, whitespace]),
).map((x) => x.join(''));
