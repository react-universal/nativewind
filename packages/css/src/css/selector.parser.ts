import * as P from '@native-twin/arc-parser';
import { mapAsType } from '../utils.parser.js';

const mapToAttributeSelector = mapAsType('ATTRIBUTE_SELECTOR');
const mapToElementSelector = mapAsType('ELEMENT_SELECTOR');
const mapToPseudoClassSelector = mapAsType('PSEUDO_CLASS_SELECTOR');
const mapToPseudoElementSelector = mapAsType('PSEUDO_ELEMENT_SELECTOR');

const selectorParserRecursive = P.recursiveParser(() =>
  P.choice([
    AttributeSelector,
    PseudoClassSelector,
    PseudoElementSelector,
    ElementParser,
    ClassParser,
  ]),
);

const validClassIdent = P.regex(/^[a-zA-Z0-9-]+/);

const quoteParser = P.choice([P.char("'"), P.char('"')]);

// [type='button']
const betweenSquareBrackets = P.between(P.char('['))(P.char(']'));
const betweenSingleQuotes = P.between(quoteParser)(quoteParser);

const ElementParser = validClassIdent.map(mapToElementSelector);

const AttributeSelector = betweenSquareBrackets(
  P.sequenceOf([validClassIdent, P.char('='), betweenSingleQuotes(validClassIdent)]),
).map((x) => mapToAttributeSelector(`[${x[0]}${x[1]}'${x[2]}']`));

const ClassParser = P.sequenceOf([P.char('.'), validClassIdent]).map((x) =>
  mapToAttributeSelector(x.join('')),
);

const PseudoClassSelector = P.sequenceOf([P.char(':'), validClassIdent]).map((x) =>
  mapToPseudoClassSelector(x.join('')),
);
const PseudoElementSelector = P.sequenceOf([P.literal('::'), validClassIdent]).map((x) =>
  mapToPseudoElementSelector(x.join('')),
);

export const selectorParser = P.separatedByComma(P.many1(selectorParserRecursive));
