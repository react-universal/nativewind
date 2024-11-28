import { Parser } from './Parser.js';

// pipeParsers :: [Parser * * *] -> Parser * * *
export function pipeParsers<A>([p1]: [Parser<A>]): Parser<A>;
export function pipeParsers<A, B>([p1, p2]: [Parser<A>, Parser<B>]): Parser<B>;
export function pipeParsers<A, B, C>([p1, p2, p3]: [
  Parser<A>,
  Parser<B>,
  Parser<C>,
]): Parser<C>;
export function pipeParsers(parsers: Parser<any>[]): Parser<any>;
export function pipeParsers(parsers: Parser<any>[]): Parser<any> {
  return new Parser(function pipeParsers$state(state) {
    let nextState = state;
    for (const parser of parsers) {
      nextState = parser.transform(nextState);
    }
    return nextState;
  });
}

// composeParsers :: [Parser * * *] -> Parser * * *
export function composeParsers<A, B>([p1, p2]: [Parser<A>, Parser<B>]): Parser<A>;
export function composeParsers<A, B, C>([p1, p2, p3]: [
  Parser<A>,
  Parser<B>,
  Parser<C>,
]): Parser<A>;
export function composeParsers(parsers: Parser<any>[]): Parser<any>;
export function composeParsers(parsers: Parser<any>[]): Parser<any> {
  return new Parser(function composeParsers$state(state) {
    return pipeParsers([...parsers].reverse()).transform(state);
  });
}
