import type {
  Rule,
  RuleMeta,
  RuntimeTW,
  TailwindConfig,
  ThemeContext,
  __Theme__,
} from '@native-twin/core';
import type { CompleteStyle, SheetEntry } from '@native-twin/css';
import type { TailwindPresetTheme } from '@native-twin/preset-tailwind';
import type * as HashSet from 'effect/HashSet';

export type InternalTwinConfig = TailwindConfig<__Theme__ & TailwindPresetTheme>;
export type InternalTwFn = RuntimeTW<__Theme__ & TailwindPresetTheme, SheetEntry[]>;
export type InternalTwinThemeContext = ThemeContext<__Theme__ & TailwindPresetTheme>;

export interface TwinStore {
  twinVariants: HashSet.HashSet<TwinVariantCompletion>;
  twinRules: HashSet.HashSet<TwinRuleCompletion>;
}

export interface TwinRuleCompletion {
  kind: 'rule';
  readonly order: number;
  readonly rule: TwinRuleParts;
  readonly completion: {
    className: string;
    declarations: string[];
    declarationValue: string;
  };
  readonly composition: {
    composed: string;
    classNameExpansion: string;
    classNameSuffix: string;
    declarationSuffixes: string[];
  };
}
export interface TwinRuleParts {
  readonly pattern: string;
  readonly property: InternalNativeTwinRule[1] | keyof CompleteStyle | (string & {});
  readonly themeSection: InternalNativeTwinRule[1] | (string & {});
  readonly resolver: InternalNativeTwinRule[2];
  readonly meta: RuleMeta;
}

export type InternalNativeTwinRule = Rule<InternalTwinConfig['theme']>;

interface CommonCompletion {
  name: string;
  position: number;
  index: number;
}

export interface TwinVariantCompletion extends CommonCompletion {
  kind: 'variant';
}
