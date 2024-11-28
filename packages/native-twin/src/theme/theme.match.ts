import { parsedRuleToClassName, type SheetEntryDeclaration } from '@native-twin/css';
import { asArray, toColorValue } from '@native-twin/helpers';
import type {
  CompleteStyleKeys,
  Rule,
  RuleMeta,
  RuleResolver,
} from '../types/config.types.js';
import type { __Theme__ } from '../types/theme.types.js';

export function matchCssObject(
  pattern: string,
  resolver: RuleResolver<__Theme__>,
  meta: RuleMeta = {
    canBeNegative: false,
    feature: 'default',
    prefix: '',
    suffix: '',
    styleProperty: undefined,
    support: [],
  },
): Rule<__Theme__> {
  return [pattern, null, resolver, meta];
}

export function matchThemeColor(
  pattern: string,
  property: CompleteStyleKeys,
  meta: RuleMeta = {
    feature: 'default',
    styleProperty: property,
    canBeNegative: false,
    prefix: '',
    suffix: '',
    support: [],
  },
): Rule<__Theme__> {
  return [
    pattern,
    'colors',
    (match, context, rule) => {
      let color: string | null | undefined;
      const className = parsedRuleToClassName(rule);
      const declarations: SheetEntryDeclaration[] = [];
      if (match.segment.type == 'arbitrary') {
        color = match.segment.value;
      }
      if (!color) {
        color =
          context.colors[match.segment.value] ??
          context.theme('colors', match.segment.value);
      }
      if (color) {
        const opacity = context.theme('opacity', rule.m?.value ?? '100');
        color = toColorValue(color!, {
          opacityValue: opacity ?? '1',
        });
        if (meta.feature == 'edges') {
          for (const key of getPropertiesForEdges(
            {
              prefix: meta.prefix ?? property,
              suffix: meta.suffix ?? '',
            },
            match.suffixes,
          )) {
            declarations.push({
              prop: key,
              value: color,
            });
          }
        } else {
          declarations.push({ prop: property, value: color });
        }
        return {
          className,
          declarations,
          selectors: [],
          precedence: 0,
          important: rule.i,
          animations: [],
          preflight: false,
        };
      }
      return undefined;
    },
    meta,
  ];
}

export function matchAnimation<Theme extends __Theme__ = __Theme__>(
  pattern: string,
): Rule<Theme> {
  return [
    pattern,
    null,
    (_match, ctx, parsed) => {
      const animation = ctx.animations.find((x) => x[0] === parsed.n);
      return {
        className: animation?.[0] ?? 'NONCE',
        declarations: [] as any,
        animations: asArray(animation?.[1]),
        important: parsed.i,
        precedence: parsed.p,
        selectors: parsed.v,
        preflight: false,
      };
    },
  ];
}

export function matchThemeValue<Theme extends __Theme__ = __Theme__>(
  pattern: string,
  themeSection: keyof Theme,
  property: CompleteStyleKeys,
  meta: RuleMeta = {
    canBeNegative: false,
    feature: 'default',
    prefix: '',
    suffix: '',
    styleProperty: property,
    support: [],
  },
): Rule<Theme> {
  return [
    pattern,
    themeSection,
    (match, context, parsedRule) => {
      let value: string | null = null;
      let segmentValue = match.segment.value;
      const declarations: SheetEntryDeclaration[] = [];
      if (parsedRule.m) {
        segmentValue += `/${parsedRule.m.value}`;
      }
      if (match.segment.type == 'arbitrary') {
        value = segmentValue;
      } else {
        value = context.theme(themeSection, segmentValue) ?? null;
      }

      if (!value) return;
      const properties = getProperties();

      // if (typeof value == 'object' && !Array.isArray(value)) {
      //   declarations.push(...(Object.entries(value) as [string, string][]));
      // } else {

      // }
      for (const current of properties) {
        declarations.push({
          prop: current,
          value: maybeNegative(match.negative, value),
        });
      }
      if (property == 'transform') {
        const entries = [...declarations];
        declarations.length = 0;
        declarations.push({
          prop: 'transform',
          value: entries,
        });
      }
      return {
        className: parsedRuleToClassName(parsedRule),
        declarations,
        selectors: [],
        precedence: 0,
        important: parsedRule.i,
        animations: [],
        preflight: false,
      };

      function getProperties() {
        if (meta.feature == 'edges') {
          return getPropertiesForEdges(
            {
              prefix: meta.prefix ?? property,
              suffix: meta.suffix ?? '',
            },
            match.suffixes,
          );
        }

        if (meta.feature == 'transform-2d') {
          return getPropertiesForTransform2d(meta.prefix ?? property, match.suffixes);
        }

        if (meta.feature == 'corners') {
          return getPropertiesForCorners(
            {
              prefix: meta.prefix ?? property,
              suffix: meta.suffix ?? '',
            },
            match.suffixes,
          );
        }

        if (meta.feature == 'gap') {
          return getPropertiesForGap(
            {
              prefix: meta.suffix ?? '',
              suffix: property ?? '',
            },
            match.suffixes,
          );
        }
        return asArray(property);
      }
    },
    meta,
  ];
}

function getPropertiesForEdges(
  property: { prefix: string; suffix: string },
  edges: string[],
) {
  if (edges.length == 0) return [`${property.prefix}${property.suffix}`];
  return edges.map((x) => {
    return `${property.prefix}${x}${property.suffix}`;
  });
}

function getPropertiesForTransform2d(property: string, sides: string[]) {
  if (sides.length == 0) return [`${property}`];
  return sides.map((x) => {
    return `${property}${x}`;
  });
}

function getPropertiesForGap(
  property: { prefix: string; suffix: string },
  edges: string[],
) {
  if (edges.length == 0) return [`${property.prefix}${property.suffix}`];
  return edges.map((x) => {
    return `${property.prefix}${x}${property.suffix.replace(
      /^[a-z]/,
      (k) => k[0]?.toUpperCase()! ?? '',
    )}`;
  });
}

function getPropertiesForCorners(
  property: { prefix: string; suffix: string },
  corners: string[],
) {
  if (corners.length == 0) return [`${property.prefix}${property.suffix}`];
  return corners.map((x) => {
    return `${property.prefix}${x}${property.suffix}`;
  });
}

function maybeNegative(isNegative: boolean, value: string): string {
  if (isNegative && (!`${value}`.startsWith('0') || `${value}`.startsWith('0.'))) {
    return `-${value}`;
  }
  return value;
}
