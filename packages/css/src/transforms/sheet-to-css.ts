import {
  asArray,
  escapeSelector,
  toColorValue,
  toHyphenCase,
} from '@native-twin/helpers';
import type { SheetEntry, SheetEntryDeclaration } from '../sheets/sheet.types.js';

export function sheetEntriesToCss(
  entries: SheetEntry[] | SheetEntry = [],
  forMetro = false,
): string {
  return asArray(entries)
    .filter(Boolean)
    .map((x) => {
      return getEntryRuleBlock(x, forMetro);
    })
    .join('\n');
}

function getEntryRuleBlock(entry: SheetEntry, forMetro = false) {
  let className = '';
  if (!entry.preflight) {
    className = '.';
  }
  if (!forMetro || entry.selectors.filter((x) => x.startsWith('&')).length > 0) {
    className += escapeSelector(entry.className);
  } else {
    className += entry.className;
  }

  // if (
  //   entry.className.startsWith('*') ||
  //   entry.className.startsWith(':') ||
  //   entry.className.startsWith('[')
  // ) {
  //   className = entry.className.replace(/^[.|,]/, '');
  // }

  const atRules: string[] = [];
  const declarations = sheetEntryDeclarationsToCss(entry.declarations, entry.important);

  for (const condition of entry.selectors) {
    // Media query
    if (condition.startsWith('@') && condition[1] === 'm') {
      atRules.push(condition);
      continue;
    }

    if (condition.endsWith('&')) {
      className = `${condition.replace('&', '\\')}${className}`;
    }

    // Pseudo
    if (condition.startsWith('&')) {
      className += condition.replace('&', '');
    }
  }
  return atRules.reduce((prev, current) => {
    return `${current}{${prev}}`;
  }, `${className}{${declarations}}`);
}

function sheetEntryDeclarationsToCss(decls: SheetEntryDeclaration[], important = false) {
  if (!decls) return '';
  const body: [string, string][] = [];
  for (const d of decls) {
    if (typeof d.value === 'object' && !Array.isArray(d.value)) {
      if (d.prop === 'shadowRadius') {
        body.push([
          'boxShadow',
          `${d.value.shadowOffset?.width ?? 0}px ${d.value.shadowOffset?.height ?? 1}px ${
            d.value.shadowRadius ?? 5
          }px ${toColorValue(String(d.value.shadowColor) ?? 'rgb(0,0,0)', {
            opacityValue: String(d.value.shadowOpacity) ?? '1',
          })}`,
        ]);
        continue;
      }
      body.push(...Object.entries(d.value));
    }
    if (Array.isArray(d.value)) {
      if (d.prop === 'transform') {
        const transformValue = rnTransformToCss(d.value);
        body.push(...transformValue);
        body.push(['transform', 'var(--tw-transform)']);
      }
    }
    if (typeof d.value === 'string') {
      body.push([d.prop, d.value]);
    }
  }
  return declarationToCss(body, important);
}

function declarationToCss(entries: [string, string][], important = false): string {
  return entries
    .flatMap((x) => `${toHyphenCase(x[0])}:${x[1]}${important ? ' !important' : ''};`)
    .join('');
}

function rnTransformToCss(transform: SheetEntryDeclaration[]): [string, any][] {
  const value = transform.flatMap((current): [string, any][] => {
    if (current.prop === 'translate') {
      return [
        ['--tw-translate-x', current.value],
        ['--tw-translate-y', current.value],
      ];
      // prev += `--tw-translate-x=${current.value};--tw-translate-y=${current.value};`;
      // prev += `translate(${current.value}, ${current.value})`;
    }
    if (current.prop === 'translateX') {
      // prev += `--tw-translate-x=${current.value};`;
      // prev += `translateX(${current.value})`;
      return [['--tw-translate-x', current.value]];
    }
    if (current.prop === 'translateY') {
      // prev += `--tw-translate-y=${current.value};`;
      // prev += `translateY(${current.value})`;
      return [['--tw-translate-y', current.value]];
    }
    if (current.prop === 'skew') {
      return [
        ['--tw-skew-x', current.value],
        ['--tw-skew-y', current.value],
      ];
      // prev += `--tw-skew-x=${current.value};--tw-skew-y=${current.value};`;
      // prev += `skew(${current.value}, ${current.value})`;
    }
    if (current.prop === 'skewX') {
      return [['--tw-skew-x', current.value]];
      // prev += `--tw-skew-x=${current.value};`;
      // prev += `skewX(${current.value}, ${current.value})`;
    }
    if (current.prop === 'skewY') {
      return [['--tw-skew-y', current.value]];
      // prev += `--tw-skew-y=${current.value};`;
      // prev += `skewY(${current.value}, ${current.value})`;
    }
    if (current.prop === 'scale') {
      return [
        ['--tw-scale-x', current.value],
        ['--tw-scale-y', current.value],
      ];
      // prev += `--tw-scale-x=${current.value};--tw-scale-y=${current.value};`;
      // prev += `scale(${current.value})`;
    }
    if (current.prop === 'scaleX') {
      return [['--tw-scale-x', current.value]];
      // prev += `--tw-scale-x=${current.value};`;
      // prev += `scaleX(${current.value}, ${current.value})`;
    }
    if (current.prop === 'scaleY') {
      return [['--tw-scale-y', current.value]];
      // prev += `--tw-scale-y=${current.value};`;
      // prev += `scaleY(${current.value}, ${current.value})`;
    }
    if (current.prop === 'rotate') {
      return [['--tw-rotate', current.value]];
      // prev += `--tw-scale-y=${current.value};`;
      // prev += `scaleY(${current.value}, ${current.value})`;
    }
    return [];
  });

  return value;
}
