import type { Rule, RuleMeta } from '@native-twin/core';
import type { CompleteStyle } from '@native-twin/css';
import type { TemplateTokenWithText } from '../template/template.types';
import type { InternalTwinConfig } from './nativeTwin.config';

export type InternalNativeTwinRule = Rule<InternalTwinConfig['theme']>;

interface CommonCompletionToken {
  name: string;
  position: number;
  index: number;
}
export interface ClassCompletionToken extends CommonCompletionToken {
  kind: 'class';
  property: string;
  themeSection: string;
  canBeNegative: boolean;
  isColor: boolean;
  themeValue: string | null;
}

export interface VariantCompletionToken extends CommonCompletionToken {
  kind: 'variant';
}

export interface CompletionItemLocation {
  position: number;
  index: number;
}

export interface TwinVariantParts {
  readonly name: string;
}

export interface TwinRuleParts {
  readonly pattern: string;
  readonly property: InternalNativeTwinRule[1] | keyof CompleteStyle | (string & {});
  readonly themeSection: InternalNativeTwinRule[1] | (string & {});
  readonly resolver: InternalNativeTwinRule[2];
  readonly meta: RuleMeta;
}

export interface TwinRuleWithCompletion {
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

export interface TwinRuleCompletionWithToken extends TwinRuleWithCompletion {
  token: TemplateTokenWithText;
}
