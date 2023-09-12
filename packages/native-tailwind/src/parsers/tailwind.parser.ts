import * as P from '@universal-labs/css/parser';
import type {
  ArbitraryToken,
  ClassNameToken,
  GroupToken,
  ParsedRule,
  VariantClassToken,
  VariantToken,
} from '../types/parser.types';

// UTILS
const classNameIdent = /^[a-z0-9A-Z-.]+/;

const matchBetweenParens = P.between(P.char('('))(P.char(')'));

const mapResult =
  <Type extends string>(type: Type) =>
  <Value>(value: Value) => ({
    type,
    value,
  });
const mapArbitrary = mapResult('ARBITRARY');
const mapClassName = mapResult('CLASS_NAME');
const mapVariant = mapResult('VARIANT');
const mapVariantClass = mapResult('VARIANT_CLASS');
const mapGroup = mapResult('GROUP');
const mapColorModifier = mapResult('COLOR_MODIFIER');

const validValues = P.recursiveParser(
  (): P.Parser<GroupToken | VariantClassToken | ClassNameToken> =>
    P.choice([matchGroup, matchVariantClass, matchClassName]),
);

// CLASSNAMES

/** Match value inside [...] */
const matchArbitrary = P.between(P.char('['))(P.char(']'))(P.everyCharUntil(']')).map(
  (x) => `[${x}]`,
);

/** Match color modifiers like: `.../10` or `.../[...]` */
const colorModifier = P.sequenceOf([P.char('/'), P.choice([P.digits, matchArbitrary])]).map(
  (x) => mapColorModifier(x[1]),
);

/** Match important prefix like: `!hidden` */
const maybeImportant = P.maybe(P.char('!')).map((x) => !!x);

/** Match variants prefixes like `md:` or stacked like `hover:md:` or `!md:hover:` */
const matchVariant = P.many1(
  P.sequenceOf([maybeImportant, P.regex(classNameIdent), P.char(':')]),
).map(
  (x): VariantToken =>
    mapVariant(
      x.map((y) => ({
        i: y[0],
        n: y[1],
      })),
    ),
);

/** Match classnames with important prefix arbitrary and color modifiers */
const matchClassName = P.sequenceOf([
  maybeImportant,
  P.regex(classNameIdent),
  P.maybe(matchArbitrary),
  P.maybe(colorModifier),
]).map(
  (x): ClassNameToken =>
    mapClassName({
      i: x[0],
      n: x[1] + (x[2] ? x[2] : ''),
      m: x[3],
    }),
);

/** Match variants prefixes that includes a single class like `md:bg-blue-200` */
const matchVariantClass = P.sequenceOf([matchVariant, matchClassName]).map(
  (x): VariantClassToken => mapVariantClass(x),
);

// GROUPS
/** Match any valid TW ident or arbitrary separated by spaces */
const matchGroupContent = matchBetweenParens(
  P.separatedBySpace(
    P.choice([validValues, matchArbitrary.map((x): ArbitraryToken => mapArbitrary(x))]),
  ),
);

/**
 * Match className groups like `md:(...)` or stacked like `hover:md:(...)` or feature prefix `text(...)`
 * */
const matchGroup = P.sequenceOf([
  P.choice([matchVariant, matchClassName]),
  matchGroupContent,
]).map(
  (x): GroupToken =>
    mapGroup({
      base: x[0],
      content: x[1],
    }),
);
/** Recursive syntax parser all utils separated by space */
export const tailwindClassNamesParser = P.separatedBySpace(validValues);

function translateRules(
  tokens: (GroupToken | VariantClassToken | ClassNameToken | ArbitraryToken)[],
  result: ParsedRule[] = [],
): ParsedRule[] {
  const current = tokens.shift();
  if (!current) return result;
  if (current.type == 'CLASS_NAME') {
    result.push({
      n: current.value.n,
      v: [],
      i: current.value.i,
      m: current.value.m,
    });
    return translateRules(tokens, result);
  }
  if (current.type == 'VARIANT_CLASS') {
    result.push({
      n: current.value[1].value.n,
      v: current.value[0].value.map((x) => x.n),
      i: current.value[1].value.i || current.value[0].value.some((x) => x.i),
      m: current.value[1].value.m,
    });
    return translateRules(tokens, result);
  }
  if (current.type == 'GROUP') {
    const baseValue = current.value.base;
    const content = mergeGroups(current.value.content).map((x) => {
      if (baseValue.type == 'CLASS_NAME') {
        return {
          ...x,
          i: baseValue.value.i,
          m: baseValue.value.m,
          n: baseValue.value.n + '-' + x.n,
        };
      }
      return {
        ...x,
        v: [...x.v, ...baseValue.value.map((y) => y.n)],
        i: x.i || baseValue.value.some((y) => y.i),
      };
    });
    result.push(...content);
    return translateRules(tokens, result);
  }
  return result;
}

function mergeGroups(
  groupContent: (ClassNameToken | VariantClassToken | ArbitraryToken | GroupToken)[],
  results: ParsedRule[] = [],
): ParsedRule[] {
  let nextToken = groupContent.shift();
  if (!nextToken) return results;
  if (nextToken.type == 'ARBITRARY') {
    results.push({
      n: nextToken.value,
      v: [],
      i: false,
      m: null,
    });
  }
  if (nextToken.type == 'CLASS_NAME') {
    results.push({
      n: nextToken.value.n,
      v: [],
      i: nextToken.value.i,
      m: nextToken.value.m,
    });
  }
  if (nextToken.type == 'VARIANT_CLASS') {
    results.push({
      n: nextToken.value[1].value.n,
      v: nextToken.value[0].value.map((y) => y.n),
      i: nextToken.value[1].value.i || nextToken.value[0].value.some((y) => y.i),
      m: nextToken.value[1].value.m,
    });
  }
  if (nextToken.type == 'GROUP') {
    const baseValue = nextToken.value.base;
    const parts = mergeGroups(nextToken.value.content).map((x): ParsedRule => {
      if (baseValue.type == 'CLASS_NAME') {
        return {
          ...x,
          i: baseValue.value.i,
          m: baseValue.value.m,
          n: baseValue.value.n + '-' + x.n,
        };
      }
      return {
        ...x,
        v: [...x.v, ...baseValue.value.map((y) => y.n)],
        i: x.i || baseValue.value.some((y) => y.i),
      };
    });
    results.push(...parts);
  }
  return mergeGroups(groupContent, results);
}

export function parseTWTokens(rules: string) {
  const data = tailwindClassNamesParser.run(rules);
  if (data.isError) {
    // eslint-disable-next-line no-console
    console.warn('Failed parsing rules: ', rules);
    return [];
  }
  return translateRules(data.result);
}