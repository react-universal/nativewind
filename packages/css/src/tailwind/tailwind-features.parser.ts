import * as P from '@native-twin/arc-parser';
import { asArray, keysOf } from '@native-twin/helpers';
import type { CssFeature } from '../css/css.types.js';
import {
  maybeNegativeParser,
  twArbitraryParser,
  twSegmentParser,
} from './tailwind-common.parser.js';
import { cornerMap, directionMap } from './tailwind.constants.js';
import type { RuleHandlerToken } from './tailwind.types.js';

export const edgesParser = P.sequenceOf([
  P.choice([
    P.literal('x'),
    P.literal('y'),
    P.literal('t'),
    P.literal('l'),
    P.literal('b'),
    P.literal('r'),
  ]),
  P.char('-'),
]).map((x) => {
  return directionMap[x[0]];
});

export const transform2dParser = P.sequenceOf([
  P.choice([P.literal('x'), P.literal('y')]),
  P.char('-'),
]).map((x) => {
  return asArray(x[0].toUpperCase());
});

export const transform3dParser = P.sequenceOf([
  P.choice([P.literal('x'), P.literal('y'), P.literal('z')]),
  P.char('-'),
]).map((x) => {
  return asArray(x[0].toUpperCase());
});

export const cornersParser = P.choice(
  keysOf(cornerMap).map((x) => P.sequenceOf([P.literal(x), P.char('-')])),
).map((x: [keyof typeof cornerMap, string]) => {
  return cornerMap[x[0]];
});

export const gapParser = P.sequenceOf([
  P.choice([P.literal('x'), P.literal('y')]),
  P.char('-'),
]).map((x) => {
  return asArray(
    {
      x: 'column',
      y: 'row',
    }[x[0]],
  );
});

export const getTWFeatureParser = (
  pattern: string,
  patternParser: P.Parser<string>,
  feature: CssFeature = 'default',
) => {
  switch (feature) {
    case 'edges':
      return resolveEdges(pattern, patternParser);
    case 'corners':
      return resolveCorners(pattern, patternParser);
    case 'gap':
      return resolveGap(patternParser);
    case 'transform-2d':
      return resolveTransform2d(pattern, patternParser);
    case 'transform-3d':
      return resolveTransform3d(pattern, patternParser);
    case 'colors':
    case 'default':
    default:
      return defaultResolver(pattern, patternParser);
  }
};

const resolveEdges = (pattern: string, patternParser: P.Parser<string>) => {
  if (!pattern.endsWith('-')) {
    patternParser = P.sequenceOf([patternParser, P.maybe(P.char('-'))]).map((x) => x[0]);
  }
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.maybe(edgesParser),
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[3],
    base: x[1],
    negative: x[0],
    suffixes: x[2] ?? [],
  }));
};

const defaultResolver = (pattern: string, patternParser: P.Parser<string>) => {
  if (!pattern.endsWith('-') || pattern.includes('|')) {
    return P.sequenceOf([maybeNegativeParser, patternParser, P.endOfInput]).map(
      (x): RuleHandlerToken => ({
        segment: {
          type: 'segment',
          value: x[1],
        },
        base: x[1],
        suffixes: [],
        negative: x[0],
      }),
    );
  }
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[2],
    base: x[1],
    suffixes: [],
    negative: x[0],
  }));
};

const resolveCorners = (pattern: string, patternParser: P.Parser<string>) => {
  if (!pattern.endsWith('-')) {
    patternParser = P.sequenceOf([patternParser, P.maybe(P.char('-'))]).map((x) => x[0]);
  }
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.maybe(cornersParser),
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[3],
    base: x[1],
    negative: x[0],
    suffixes: x[2] ?? [],
  }));
};

const resolveTransform2d = (pattern: string, patternParser: P.Parser<string>) => {
  if (!pattern.endsWith('-')) {
    patternParser = P.sequenceOf([patternParser, P.maybe(P.char('-'))]).map((x) => x[0]);
  }
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.maybe(transform2dParser),
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[3],
    base: x[1],
    negative: x[0],
    suffixes: x[2] ?? [],
  }));
};

const resolveTransform3d = (pattern: string, patternParser: P.Parser<string>) => {
  if (!pattern.endsWith('-')) {
    patternParser = P.sequenceOf([patternParser, P.maybe(P.char('-'))]).map((x) => x[0]);
  }
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.maybe(transform3dParser),
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[3],
    base: x[1],
    negative: x[0],
    suffixes: x[2] ?? [],
  }));
};

const resolveGap = (patternParser: P.Parser<string>) => {
  return P.sequenceOf([
    maybeNegativeParser,
    patternParser,
    P.maybe(gapParser),
    P.choice([twArbitraryParser, twSegmentParser]),
    P.endOfInput,
  ]).map((x) => ({
    segment: x[3],
    base: x[1],
    negative: x[0],
    suffixes: x[2] ?? [],
  }));
};
