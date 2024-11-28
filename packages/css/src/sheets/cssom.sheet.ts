import { noop, toHyphenCase, warn } from '@native-twin/helpers';
import { getStyleElement } from '../html/get-style-element.js';
import { sheetEntriesToCss } from '../transforms/sheet-to-css.js';
import type { Sheet } from './sheet.types.js';

export function createCssomSheet(element?: CSSStyleSheet): Sheet<CSSStyleSheet> {
  const target = (element as CSSStyleSheet)?.cssRules
    ? (element as CSSStyleSheet)
    : (getStyleElement(element as any).sheet as CSSStyleSheet);

  return {
    target,
    registry: new Map(),
    snapshot() {
      // collect current rules
      const rules = Array.from(target.cssRules, (rule) => rule.cssText);

      return () => {
        // remove all existing rules
        this.clear();

        // add all snapshot rules back
        rules.forEach(this.insert as any);
      };
    },

    clear() {
      // remove all added rules
      for (let index = target.cssRules.length; index--; ) {
        target.deleteRule(index);
      }
    },

    destroy() {
      target.ownerNode?.remove();
    },

    insert(entry, index) {
      const className = entry.className;
      const cssText = typeof entry == 'string' ? entry : sheetEntriesToCss(entry);
      try {
        // Insert
        target.insertRule(cssText, index);
      } catch (error) {
        // Empty rule to keep index valid — not using `*{}` as that would show up in all rules (DX)
        target.insertRule(':root{}', index);

        // Some thrown errors are because of specific pseudo classes
        // lets filter them to prevent unnecessary warnings
        // ::-moz-focus-inner
        // :-moz-focus-ring
        if (!/:-[mwo]/.test(className)) {
          warn((error as Error).message, 'TW_INVALID_CSS', className);
        }
      }
    },

    insertPreflight(data) {
      const nodes: string[] = [];
      for (const p of Object.entries(data)) {
        const className = p[0];
        const declarations: string[] = [];
        for (const d of Object.entries(p[1])) {
          declarations.push([toHyphenCase(d[0]), d[1]].join(':'));
        }
        const current = `${className}{${declarations.join(';')}}`;
        nodes.push(current);
        try {
          target.insertRule(current, 0);
        } catch (error) {
          target.insertRule(':root{}', 0);

          // Some thrown errors are because of specific pseudo classes
          // lets filter them to prevent unnecessary warnings
          // ::-moz-focus-inner
          // :-moz-focus-ring
          if (!/:-[mwo]/.test(className)) {
            warn((error as Error).message, 'TW_INVALID_CSS', className);
          }
        }
      }

      return nodes;
    },

    resume: noop,
  };
}
