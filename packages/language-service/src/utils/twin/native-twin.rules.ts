import { cornerMap, directionMap, TWScreenValueConfig } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Data from 'effect/Data';
import { pipe } from 'effect/Function';
import type { RuleMeta } from '@native-twin/core';
import { ColorsRecord, asArray } from '@native-twin/helpers';
import { DEFAULT_RULE_META } from '../constants.utils';
import {
  InternalNativeTwinRule,
  TwinRuleParts,
  TwinRuleCompletion,
} from '../../models/twin/native-twin.types';

export function getRuleParts(rule: InternalNativeTwinRule): TwinRuleParts {
  const pattern = rule[0];
  const resolver = rule[2];
  const meta = rule[3] ?? DEFAULT_RULE_META;
  let themeSection: TwinRuleParts['themeSection'];
  let property: TwinRuleParts['property'];

  if (meta.styleProperty) {
    themeSection = rule[1];
    property = meta.styleProperty;
  } else if (meta.prefix && meta.prefix !== '') {
    property = meta.prefix;
    themeSection = rule[1];
  } else {
    themeSection = rule[1];
    property = rule[1];
  }

  return Data.struct({
    pattern,
    resolver,
    themeSection,
    property,
    meta,
  });
}

export const createRuleCompositions = (rule: InternalNativeTwinRule) => {
  const parts = getRuleParts(rule);
  const compositions = createCompositions(parts.pattern, parts.meta);
  return compositions.map((composition) => ({ composition, parts }));
};

export const createRuleComposer = (ruleInfo: {
  pattern: string;
  feature: RuleMeta['feature'];
}) => {
  const composer = composeClassName(ruleInfo.pattern);
  let mapper: Record<string, string[]> = {};

  if (ruleInfo.feature === 'edges') {
    mapper = directionMap;
  }
  if (ruleInfo.feature === 'corners') {
    mapper = cornerMap;
  }

  if (ruleInfo.feature === 'transform-2d') {
    ruleInfo;
    // if (sides.length == 0) return [`${property}`];
    // return sides.map((x) => {
    //   return `${property}${x}`;
    // });
  }

  const suffixes = Object.entries(mapper).flatMap((x) => {
    return Data.struct({
      classNameSuffix: x[0],
      declarationSuffixes: x[1],
    });
  });

  return {
    suffixes,
    expansions: pipe(
      suffixes,
      RA.map((x) => {
        const classNameExpansion = composeExpansion(x.classNameSuffix).replace('--', '-');
        // const declarationExpansions = x.declarationSuffixes.map((y) => ``);
        const composed = composer(classNameExpansion);
        return Data.struct({
          classNameExpansion,
          composed,
        });
      }),
    ),
  };
};

const composeClassName = (pattern: string) => (suffix: string) => {
  if (pattern.endsWith('-')) {
    return `${pattern}${suffix}`;
  }
  if (suffix == pattern) return pattern;
  if (pattern.includes('|')) return suffix;
  return pattern + suffix;
};

const composeExpansion = (expansion: string) => {
  if (!expansion || expansion == '') {
    return `-${expansion}`;
  }
  return `${expansion}-`;
};

export const createCompositions = (pattern: string, meta: RuleMeta) => {
  const composer = composeClassName(pattern);
  let mapper: Record<string, string[]> = {};

  if (meta.feature === 'edges') {
    mapper = directionMap;
  }
  if (meta.feature === 'corners') {
    mapper = cornerMap;
  }
  if (meta.feature === 'transform-2d') {
    mapper = {
      x: directionMap.x,
      y: directionMap.y,
    };
  }
  if (meta.feature === 'transform-3d') {
    mapper = {
      x: directionMap.x,
      y: directionMap.y,
      z: directionMap.x,
    };
  }
  if (meta.feature === 'default') {
    return asArray(
      Data.struct({
        composed: pattern,
        classNameExpansion: '',
        classNameSuffix: meta.suffix ?? '',
        declarationSuffixes: [meta.suffix ?? ''],
      }),
    );
  }

  const suffixes = Object.entries(mapper).flatMap((x) => {
    const classNameExpansion = composeExpansion(x[0]).replace('--', '-');
    const composed = composer(classNameExpansion);
    return Data.struct({
      composed,
      classNameExpansion,
      classNameSuffix: x[0],
      declarationSuffixes: x[1],
    });
  });

  return suffixes;
};

export const createRuleClassNames = (
  values: Record<string, TWScreenValueConfig> | ColorsRecord,
  composition: TwinRuleCompletion['composition'],
  rule: TwinRuleParts,
) => {
  const result: {
    className: string;
    declarations: string[];
    declarationValue: string;
  }[] = [];
  for (const key in values) {
    if (key.includes('DEFAULT')) continue;
    const parts = Data.struct({
      className: `${composition.composed}${key}`.replace('--', '-'),
      declarations: composition.declarationSuffixes.map(
        (x) => `${String(rule.property ?? '')}${x}${rule.meta.suffix ?? ''}`,
      ),
      declarationValue: values[key] as string,
    });
    result.push(parts);
    if (rule.meta.canBeNegative) {
      result.push(
        Data.struct({
          ...parts,
          declarationValue: `-${values[key]}`,
          className: `-${parts.className}`,
        }),
      );
    }
  }

  return result;
};
