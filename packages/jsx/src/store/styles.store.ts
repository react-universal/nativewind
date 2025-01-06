import type { SheetEntryHandler } from '@native-twin/css/jsx';
import { type Atom, atom } from '@native-twin/helpers/react';

export const globalStyles = new Map<string, Atom<SheetEntryHandler>>();
export const opaqueStyles = new WeakMap<object, SheetEntryHandler>();

export function upsertGlobalStyle(name: string, ruleSet: SheetEntryHandler) {
  let styleObservable = globalStyles.get(name);

  if (!styleObservable) {
    styleObservable = atom(ruleSet);
    globalStyles.set(name, styleObservable);
    if (process.env['NODE_ENV'] !== 'production') {
      const originalGet = styleObservable.get;
      styleObservable.get = () => {
        const value = originalGet();
        return value;
      };
    }
  }

  styleObservable.set(ruleSet);
}
