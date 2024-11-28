import type { TWScreenValueConfig, VariantClassToken } from '@native-twin/css';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Option from 'effect/Option';
import * as Record from 'effect/Record';
import type { __Theme__ } from '@native-twin/core';
import { ColorsRecord, asArray, toColorValue } from '@native-twin/helpers';
import {
  TemplateTokenWithText,
  TemplateTokenData,
} from '../../models/twin/template-token.model.js';
import { createRuleClassNames, createRuleCompositions } from './native-twin.rules.js';
import {
  TwinRuleCompletion,
  TwinVariantCompletion,
  InternalTwFn,
  InternalTwinConfig,
  InternalTwinThemeContext,
  TwinStore,
} from '../../models/twin/native-twin.types.js';
import { LocatedParser, TemplateToken } from '../../models/twin/parser.types.js';

export const createTwinStore = (nativeTwinHandler: {
  tw: InternalTwFn;
  context: InternalTwinThemeContext;
  config: InternalTwinConfig;
}): TwinStore => {
  const theme = { ...nativeTwinHandler.tw.config.theme };
  const themeSections = new Set(Object.keys({ ...theme, ...theme.extend }).sort());
  // const twinRules = HashSet.empty<TwinRuleWithCompletion>();
  themeSections.delete('theme');
  themeSections.delete('extend');
  let currentIndex = 0;
  const currentConfig = nativeTwinHandler.config;
  const variants = Object.entries({
    ...currentConfig.theme.screens,
    ...currentConfig.theme.extend?.screens,
  });
  const colorPalette = {
    ...nativeTwinHandler.context.colors,
    ...nativeTwinHandler.config.theme.extend?.colors,
  };

  const twinVariants = HashSet.fromIterable(variants).pipe(
    HashSet.map((variant): TwinVariantCompletion => {
      return {
        kind: 'variant',
        name: `${variant[0]}:`,
        index: currentIndex++,
        position: currentIndex,
      } as const;
    }),
  );

  const opacities: [string, string][] = pipe(
    Option.fromNullable(nativeTwinHandler.context.theme('opacity')),
    Option.map(Record.toEntries),
    Option.getOrElse(() => []),
  );
  const flattenRules = pipe(
    nativeTwinHandler.tw.config.rules,
    RA.flatMap((rule) => {
      return pipe(
        createRuleCompositions(rule),
        RA.flatMap((composition) => {
          let values: Record<string, TWScreenValueConfig> | ColorsRecord = {};
          if (composition.parts.themeSection === 'colors') {
            values = colorPalette;
          } else {
            values =
              nativeTwinHandler.context.theme(
                composition.parts.themeSection as keyof __Theme__,
              ) ?? {};
          }
          return pipe(
            createRuleClassNames(values, composition.composition, composition.parts),
            RA.flatMap((className): TwinRuleCompletion[] => {
              const insertRule: TwinRuleCompletion = {
                kind: 'rule',
                completion: className,
                composition: composition.composition,
                rule: composition.parts,
                order: currentIndex++,
              };

              if (insertRule.rule.themeSection === 'colors') {
                const newColors = opacities.map((x) => {
                  const completion = {
                    ...insertRule.completion,
                    className: `${insertRule.completion.className}/${x[0]}`,
                    declarationValue: toColorValue(
                      insertRule.completion.declarationValue,
                      {
                        opacityValue: x[1],
                      },
                    ),
                  };
                  return {
                    ...insertRule,
                    completion,
                    order: currentIndex++,
                  };
                });
                return [...newColors, insertRule];
              }
              return asArray(insertRule);
            }),
          );
        }),
      );
    }),
  );

  const composedTwinRules: HashSet.HashSet<TwinRuleCompletion> = pipe(
    flattenRules,
    RA.sortBy((x, y) => (x.order > y.order ? 1 : -1)),
    HashSet.fromIterable,
  );

  return {
    twinRules: composedTwinRules,
    twinVariants,
  };
};

export const getFlattenTemplateToken = (
  item: TemplateTokenWithText,
  base: TemplateTokenWithText | null = null,
): TemplateTokenData[] => {
  if (
    item.token.type === 'CLASS_NAME' ||
    item.token.type === 'ARBITRARY' ||
    item.token.type === 'VARIANT_CLASS' ||
    item.token.type === 'VARIANT'
  ) {
    if (!base) return asArray(new TemplateTokenData(item, base));

    if (base.token.type === 'VARIANT') {
      const className = `${base.token.value.map((x) => x.n).join(':')}:${item.text}`;
      return asArray(
        new TemplateTokenData(
          new TemplateTokenWithText(item.token, className, item.templateStarts),
          base,
        ),
      );
    }

    if (base.token.type === 'CLASS_NAME') {
      if (item.token.type === 'CLASS_NAME') {
        return asArray(
          new TemplateTokenData(
            new TemplateTokenWithText(
              item.token,
              `${base.token.value.n}-${item.text}`,
              item.templateStarts,
            ),
            base,
          ),
        );
      }

      if (item.token.type === 'VARIANT') {
        console.log(base, item);
      }

      if (item.token.type === 'VARIANT_CLASS') {
        const className = `${variantTokenToString(item.token)}${base.token.value.n}-${item.token.value[1].value.n}`;
        return asArray(
          new TemplateTokenData(
            new TemplateTokenWithText(item.token, className, item.templateStarts),
            base,
          ),
        );
      }
    }
  }

  if (item.token.type === 'GROUP') {
    const base = item.token.value.base;
    const classNames = item.token.value.content.flatMap((x) =>
      getFlattenTemplateToken(x, base),
    );
    return classNames;
  }

  return [];
};

export function addTextToParsedRules(
  groupContent: TemplateToken[],
  text: string,
  templateStarts: number,
  results: TemplateTokenWithText[] = [],
): TemplateTokenWithText[] {
  const nextToken = groupContent.shift();
  if (!nextToken) return results;
  if (nextToken.type == 'ARBITRARY' || nextToken.type === 'CLASS_NAME') {
    results.push(
      new TemplateTokenWithText(
        nextToken,
        text.slice(nextToken.start, nextToken.end),
        templateStarts,
      ),
    );
  }

  if (nextToken.type == 'VARIANT_CLASS') {
    results.push(
      new TemplateTokenWithText(
        nextToken,
        text.slice(nextToken.start, nextToken.end),
        templateStarts,
      ),
    );
  }

  if (nextToken.type === 'GROUP') {
    const newContent = addTextToParsedRules(
      nextToken.value.content,
      text.slice(nextToken.value.base.start, nextToken.value.base.end),
      templateStarts,
    ).flatMap((x) => {
      x.text = text.slice(x.loc.start, x.loc.end);
      return x;
    });

    const base = new TemplateTokenWithText(
      nextToken.value.base,
      text.slice(nextToken.value.base.start, nextToken.value.base.end),
      templateStarts,
    );

    results.push(
      new TemplateTokenWithText(
        {
          ...nextToken,
          value: {
            base: base,
            content: newContent,
          },
        },
        text.slice(nextToken.start, nextToken.end),
        templateStarts,
      ),
    );
  }
  return addTextToParsedRules(groupContent, text, templateStarts, results);
}

export const variantTokenToString = (token: LocatedParser<VariantClassToken>) =>
  `${token.value[0].value.map((x) => x.n).join(':')}:`;
