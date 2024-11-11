import {
  ArbitraryToken,
  ClassNameToken,
  VariantClassToken,
  VariantToken,
} from '@native-twin/css';
import * as P from '@native-twin/arc-parser';
import * as TwParser from '@native-twin/css/tailwind-parser';
import { TemplateTokenWithText } from '../models/twin/template-token.model';
import { LocatedGroupToken, LocatedParser, TemplateToken } from './parser.types';
import { addTextToParsedRules } from './utils/native-twin.utils';

const mapWithLocation = <A extends object>(
  x: P.ParserState<A, any>,
  initialIndex: number,
): LocatedParser<A> => ({
  ...x.result,
  start: initialIndex,
  end: x.cursor,
});

const parseVariant: P.Parser<LocatedParser<VariantToken>> =
  TwParser.parseVariant.mapFromState(mapWithLocation);

/** Match color modifiers like: `.../10` or `.../[...]` */
export const colorModifier = P.sequenceOf([
  P.char('/'),
  P.maybe(P.choice([P.digits, TwParser.parseArbitraryValue])),
]).map((x) => TwParser.mapColorModifier(x[1] ?? 'NONE'));

/** Match classnames with important prefix arbitrary and color modifiers */
export const parseClassName = P.sequenceOf([
  TwParser.parseMaybeImportant,
  P.regex(TwParser.classNameIdent),
  P.maybe(TwParser.parseArbitraryValue),
  P.maybe(colorModifier),
])
  .map(
    (x): ClassNameToken =>
      TwParser.mapClassName({
        i: x[0],
        n: x[1] + (x[2] ? x[2] : ''),
        m: x[3],
      }),
  )
  .mapFromState(mapWithLocation);
const parseVariantClass: P.Parser<LocatedParser<VariantClassToken>> =
  TwParser.parseVariantClass.mapFromState(mapWithLocation);
const parseArbitraryValue: P.Parser<LocatedParser<ArbitraryToken>> =
  TwParser.parseArbitraryValue.map(TwParser.mapArbitrary).mapFromState(mapWithLocation);

const parseValidTokenRecursiveWeak: P.Parser<
  | LocatedParser<LocatedGroupToken>
  | LocatedParser<VariantClassToken>
  | LocatedParser<ClassNameToken>
  | LocatedParser<VariantToken>
> = P.recursiveParser(() =>
  P.choice([parseRuleGroupWeak, parseVariantClass, parseVariant, parseClassName]),
);

/** Match any valid TW ident or arbitrary separated by spaces */
const parseGroupContentWeak: P.Parser<TemplateToken[]> = P.sequenceOf([
  P.char('('),
  P.many1(
    P.choice([parseValidTokenRecursiveWeak, parseArbitraryValue, P.skip(P.whitespace)]),
  ),
  P.maybe(P.char(')')),
]).map((x) => {
  const newValue = x[1].filter(
    (y): y is TemplateToken => typeof y !== 'string' && y !== null,
  );
  return newValue;
});

const parseRuleGroupWeak: P.Parser<LocatedParser<LocatedGroupToken>> = P.choice([
  P.sequenceOf([parseVariant, parseGroupContentWeak]),
  P.sequenceOf([parseClassName, parseGroupContentWeak]),
]).mapFromState(
  (x, i): LocatedParser<LocatedGroupToken> =>
    mapWithLocation(
      {
        ...x,
        result: TwParser.mapGroup({
          base: x.result[0],
          content: x.result[1],
        }),
      },
      i,
    ),
);

export const parseTemplate = (
  template: string,
  templateStarts: number,
): TemplateTokenWithText[] => {
  const parsed = P.many1(
    P.whitespaceSurrounded(
      P.choice([parseRuleGroupWeak, parseVariantClass, parseVariant, parseClassName]),
    ),
  ).run(template);

  if (parsed.isError) {
    return [];
  }

  const data = addTextToParsedRules(parsed.result, template, templateStarts);

  return data;
};
