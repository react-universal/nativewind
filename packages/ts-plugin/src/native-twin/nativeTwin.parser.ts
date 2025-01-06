import * as P from '@native-twin/arc-parser';
import type {
  ArbitraryToken,
  ClassNameToken,
  VariantClassToken,
  VariantToken,
} from '@native-twin/css';
import * as TwParser from '@native-twin/css/tailwind-parser';
import type {
  LocatedGroupToken,
  LocatedParser,
  TemplateToken,
  TemplateTokenWithText,
} from '../template/template.types';

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

const parseClassName: P.Parser<LocatedParser<ClassNameToken>> =
  TwParser.parseClassName.mapFromState(mapWithLocation);
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

export const parseTemplate = (template: string): TemplateTokenWithText[] => {
  const parsed = P.many(
    P.whitespaceSurrounded(
      P.choice([parseRuleGroupWeak, parseVariantClass, parseVariant, parseClassName]),
    ),
  ).run(template);

  if (parsed.isError) {
    return [];
  }

  const data = addTextToTemplateTokens(parsed.result, template);

  return data;
};

function addTextToTemplateTokens(
  groupContent: TemplateToken[],
  text: string,
  results: TemplateTokenWithText[] = [],
): TemplateTokenWithText[] {
  const nextToken = groupContent.shift();
  if (!nextToken) return results;
  if (nextToken.type === 'ARBITRARY') {
    results.push({
      ...nextToken,
      text: text.slice(nextToken.start, nextToken.end),
    });
  }
  if (nextToken.type === 'CLASS_NAME') {
    results.push({
      ...nextToken,
      text: text.slice(nextToken.start, nextToken.end),
    });
  }
  if (nextToken.type === 'VARIANT_CLASS') {
    results.push({
      ...nextToken,
      text: text.slice(nextToken.start, nextToken.end),
    });
  }
  if (nextToken.type === 'GROUP') {
    const newContent = addTextToTemplateTokens(nextToken.value.content, text).map(
      (x): TemplateTokenWithText => {
        return {
          ...x,
          text: text.slice(x.start, x.end),
        };
      },
    );
    results.push({
      ...nextToken,
      value: {
        base: {
          ...nextToken.value.base,
          text: text.slice(nextToken.value.base.start, nextToken.value.base.end),
        },
        content: newContent,
      },
      text: text.slice(nextToken.start, nextToken.end),
    });
  }
  return addTextToTemplateTokens(groupContent, text, results);
}
