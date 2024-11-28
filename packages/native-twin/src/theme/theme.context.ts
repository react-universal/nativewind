import {
  type TWParsedRule,
  type SheetEntry,
  parsedRuleToClassName,
} from '@native-twin/css';
import { flattenColorPalette, type MaybeArray } from '@native-twin/helpers';
import { createRuleResolver } from '../parsers/rule-handler.js';
import { createVariantResolver } from '../parsers/variant-handler.js';
import type {
  RuleResult,
  TailwindConfig,
  ThemeContext,
  Variant,
  VariantResult,
} from '../types/config.types.js';
import type { __Theme__ } from '../types/theme.types.js';
import { createThemeFunction } from './theme.function.js';

interface RuleHandlerFn<Theme extends __Theme__ = __Theme__> {
  (token: TWParsedRule, ctx: ThemeContext<Theme>): RuleResult;
}

interface VariantHandlerFn<Theme extends __Theme__ = __Theme__> {
  (token: string, ctx: ThemeContext<Theme>): VariantResult;
}

export function createThemeContext<Theme extends __Theme__ = __Theme__>({
  theme: themeConfig,
  rules,
  mode,
  variants = [],
  animations
}: TailwindConfig<Theme>): ThemeContext<Theme> {
  const variantCache = new Map<string, MaybeArray<string>>();
  const variantsHandlers = new Map<Variant<Theme>, VariantHandlerFn<Theme>>();
  const ruleHandlers = new Map<string, RuleHandlerFn<Theme>>();
  const rulesCache = new Map<string, SheetEntry>();
  // const ignoredRules = new Set<string>();
  // const isIgnoredRule = (rule: ParsedRule) => {
  //   if (ignoredRules.has(rule.n)) return true;
  //   return ignorelist.some((x) => x.startsWith(rule.n));
  // };
  const ctx: ThemeContext<Theme> = {
    get colors() {
      return flattenColorPalette(
        Object.assign(
          themeConfig['colors'] ?? {},
          themeConfig['extend']?.['colors'] ?? {},
        ) ?? {},
      );
    },
    animations,

    theme: createThemeFunction(themeConfig),

    get breakpoints() {
      return Object.assign(themeConfig.screens ?? {}, themeConfig.extend?.screens);
    },

    get mode() {
      return mode;
    },

    v(value) {
      if (variantCache.has(value)) {
        return variantCache.get(value);
      }

      for (const current of variants) {
        let handler = variantsHandlers.get(current);
        if (!handler) {
          handler = createVariantResolver(current);
          variantsHandlers.set(current, handler);
        }
        const nextToken = handler(value, ctx);
        if (nextToken) {
          variantCache.set(value, nextToken);
          return nextToken;
        }
      }
      variantCache.set(value, '&:' + value);
      return variantCache.get(value);
    },

    r(token: TWParsedRule) {
      for (const current of rules) {
        const className = parsedRuleToClassName(token);

        if (rulesCache.has(className)) {
          return rulesCache.get(className);
        }
        const key = JSON.stringify(
          current.filter((x) => typeof x !== 'function' && typeof x !== 'object'),
        );
        let handler = ruleHandlers.get(key);

        if (!handler) {
          handler = createRuleResolver(current);
          ruleHandlers.set(key, handler);
        }
        const nextToken = handler(token, ctx);

        if (nextToken) {
          rulesCache.set(className, nextToken);
          return nextToken;
        }
      }
      return null;
    },
  };
  return ctx;
}
