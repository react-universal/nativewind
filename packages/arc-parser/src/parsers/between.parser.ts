import type { Parser } from './Parser.js';
import { sequenceOf } from './sequence-of.js';

export const between =
  <L>(leftParser: Parser<L>) =>
  <R>(rightParser: Parser<R>) =>
  <T>(parser: Parser<T>): Parser<T> =>
    sequenceOf([leftParser, parser, rightParser]).map(([_, x]) => x);
