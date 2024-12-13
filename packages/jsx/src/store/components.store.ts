import type { ComponentSheet } from '@native-twin/css/jsx';
import { type Atom, atom } from '@native-twin/helpers/react';

export interface ComponentState {
  meta: {
    hasGroupEvents: boolean;
    hasPointerEvents: boolean;
    isGroupParent: boolean;
  };
  interactions: {
    isLocalActive: boolean;
    isGroupActive: boolean;
  };
}

const componentsCache = new Map<string, Atom<ComponentState>>();

export function getTwinComponent(
  id: string,
  styledProps: [string, ComponentSheet][] = [],
): Atom<ComponentState> {
  const component = componentsCache.get(id);
  if (component) {
    return component;
  }
  const meta = {
    hasGroupEvents: styledProps.some((x) => x[1].metadata.hasGroupEvents),
    hasPointerEvents: styledProps.some((x) => x[1].metadata.hasPointerEvents),
    isGroupParent: styledProps.some((x) => x[1].metadata.isGroupParent),
  };
  const values = {
    interactions: {
      isGroupActive: false,
      isLocalActive: false,
    },
    meta,
  };
  const value = atom(values);
  componentsCache.set(id, value);
  return componentsCache.get(id)!;
}
