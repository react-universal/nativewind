import * as P from '@native-twin/arc-parser';
import type {
  ArbitraryToken,
  ClassNameToken,
  GroupToken,
  TWParsedRule,
  VariantClassToken,
  VariantToken,
} from './tailwind.types.js';

export const classNameIdent = /^[a-z0-9A-Z-._]+/;

export const parseClassNameIdent = P.regex(classNameIdent);

export const matchBetweenParens = P.between(P.char('('))(P.char(')'));

const mapResult =
  <Type extends string>(type: Type) =>
  <Value>(value: Value) => ({
    type,
    value,
  });
export const mapArbitrary = mapResult('ARBITRARY');
export const mapClassName = mapResult('CLASS_NAME');
export const mapVariant = mapResult('VARIANT');
export const mapVariantClass = mapResult('VARIANT_CLASS');
export const mapGroup = mapResult('GROUP');
export const mapColorModifier = mapResult('COLOR_MODIFIER');
export const mapAlias = mapResult('ALIAS_CLASSNAME');

export const parseValidTokenRecursive = P.recursiveParser(
  (): P.Parser<GroupToken | VariantClassToken | ClassNameToken> =>
    P.choice([parseRuleGroup, parseVariantClass, parseClassName]),
);

/** Match apply classname */
export const parseApplyClassName = P.sequenceOf([
  P.char('@'),
  parseValidTokenRecursive,
]).map((x) => mapAlias({ symbol: x[0], token: x[1] }));

// CLASSNAMES

/** Match value inside [...] */
export const parseArbitraryValue = P.between(P.char('['))(P.char(']'))(
  P.everyCharUntil(']'),
).map((x) => `[${x}]`);

/** Match color modifiers like: `.../10` or `.../[...]` */
export const colorModifier = P.sequenceOf([
  P.char('/'),
  P.choice([P.digits, parseArbitraryValue]),
]).map((x) => mapColorModifier(x[1]));

/** Match important prefix like: `!hidden` */
export const parseMaybeImportant = P.maybe(P.char('!')).map((x) => !!x);

/** Match variants prefixes like `md:` or stacked like `hover:md:` or `!md:hover:` */
export const parseVariant = P.many1(
  P.sequenceOf([parseMaybeImportant, P.regex(classNameIdent), P.char(':')]),
).map(
  (x): VariantToken =>
    mapVariant(
      x.map((y) => ({
        i: y[0],
        n: y[1],
      })),
    ),
);

// flex-row border-1 [:nth-of-type(2)&]:bg-blue
export const parsePseudoArbitrary = P.many(
  P.sequenceOf([parseMaybeImportant, parseArbitraryValue, P.char(':')]),
)
  .map(
    (x): VariantToken =>
      // mapArbitrary(x.replace(`[`, '').replace(']', '')),
      mapVariant(
        x.map((y) => ({
          i: y[0],
          n: y[1],
        })),
      ),
  )
  .errorMap((x) => {
    console.log('ERROR: ', x);
    return x.error ?? '';
  });

/** Match classnames with important prefix arbitrary and color modifiers */
export const parseClassName = P.sequenceOf([
  parseMaybeImportant,
  P.regex(classNameIdent),
  P.maybe(parseArbitraryValue),
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
export const parseVariantClass = P.sequenceOf([parseVariant, parseClassName]).map(
  (x): VariantClassToken => mapVariantClass(x),
);

// GROUPS
/** Match any valid TW ident or arbitrary separated by spaces */
export const parseGroupContent = matchBetweenParens(
  P.separatedBySpace(
    P.choice([
      parseValidTokenRecursive,
      parseArbitraryValue.map((x): ArbitraryToken => mapArbitrary(x)),
    ]),
  ),
);

/**
 * Match className groups like `md:(...)` or stacked like `hover:md:(...)` or feature prefix `text(...)`
 * */
export const parseRuleGroup = P.sequenceOf([
  P.choice([parseVariant, parseClassName, parsePseudoArbitrary]),
  parseGroupContent,
]).map(
  (x): GroupToken =>
    mapGroup({
      base: x[0],
      content: x[1],
    }),
);

/** Recursive syntax parser all utils separated by space */
export const tailwindClassNamesParser = P.separatedBySpace(parseValidTokenRecursive);

export function mergeParsedRuleGroupTokens(
  groupContent: (ClassNameToken | VariantClassToken | ArbitraryToken | GroupToken)[],
  results: TWParsedRule[] = [],
): TWParsedRule[] {
  const nextToken = groupContent.shift();
  if (!nextToken) return results;
  if (nextToken.type == 'ARBITRARY') {
    results.push({
      n: nextToken.value,
      v: [],
      i: false,
      m: null,
      p: 0,
    });
  }
  if (nextToken.type == 'CLASS_NAME') {
    results.push({
      n: nextToken.value.n,
      v: [],
      i: nextToken.value.i,
      m: nextToken.value.m,
      p: 0,
    });
  }
  if (nextToken.type == 'VARIANT_CLASS') {
    results.push({
      n: nextToken.value[1].value.n,
      v: nextToken.value[0].value.map((y) => y.n),
      i: nextToken.value[1].value.i || nextToken.value[0].value.some((y) => y.i),
      m: nextToken.value[1].value.m,
      p: 0,
    });
  }
  if (nextToken.type == 'GROUP') {
    const baseValue = nextToken.value.base;
    const parts = mergeParsedRuleGroupTokens(nextToken.value.content).map(
      (x): TWParsedRule => {
        if (baseValue.type == 'CLASS_NAME') {
          return {
            ...x,
            i: baseValue.value.i,
            m: baseValue.value.m ?? x.m,
            n: baseValue.value.n + '-' + x.n,
          };
        }
        return {
          ...x,
          m: x.m,
          v: [...x.v, ...baseValue.value.map((y) => y.n)],
          i: x.i || baseValue.value.some((y) => y.i),
        };
      },
    );
    results.push(...parts);
  }
  return mergeParsedRuleGroupTokens(groupContent, results);
}

/**
 * @category `Tailwind Parsers`
 * */
export function parseTWTokens(rules: string) {
  const data = tailwindClassNamesParser.run(rules);
  if (data.isError) {
    console.warn('Failed parsing rules: ', rules, data);
    return [];
  }
  return mergeParsedRuleGroupTokens(data.result);
}

/** 
 * POSSIBLE ERROR CHAIN 
 * .errorChain((x) => {
      return new P.Parser((s) => {
        const newTarget = s.target.slice(0, x.cursor - 1);
        const newState = tailwindClassNamesParser.transform({
          ...s,
          result: null,
          isError: false,
          error: null,
          cursor: 0,
          target: newTarget,
        });
        console.log('NEW_STATE: ', newState);
        return { ...newState };
      });
    })
 * */
