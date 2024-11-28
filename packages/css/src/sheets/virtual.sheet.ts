import { noop } from '@native-twin/helpers';
import { Layer } from '../css/precedence.js';
import type {
  Sheet,
  SheetEntry,
  SheetEntryDeclaration,
  SheetEntryRegistry,
} from './sheet.types.js';

export function createVirtualSheet(): Sheet<SheetEntry[]> {
  const target: SheetEntry[] = [];
  const registry = new Map<string, SheetEntryRegistry>();

  return {
    target,
    registry,
    clear() {
      target.length = 0;
      registry.clear();
    },

    destroy() {
      this.clear();
    },

    insert(entry, index) {
      target.splice(index, 0, entry);
      // registry.set(entry.className, Object.assign(entry, { index }));
    },

    snapshot() {
      const rules = [...target];

      return () => {
        target.splice(0, target.length, ...rules);
      };
    },
    insertPreflight(data) {
      const nodes: string[] = [];
      for (const p of Object.entries(data)) {
        const className = p[0];
        const declarations: SheetEntryDeclaration[] = [];
        for (const d of Object.entries(p[1])) {
          declarations.push({
            prop: d[0],
            value: d[1] as any,
          });
        }
        target.push({
          className: className,
          declarations,
          important: false,
          precedence: Layer.b,
          selectors: [],
          animations: [],
          preflight: true,
        });
      }

      return nodes;
    },
    resume: noop,
  };
}
