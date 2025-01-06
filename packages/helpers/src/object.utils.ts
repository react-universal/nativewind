import type { ColorsRecord } from './utility.types.js';

export function flattenObjectByPath(obj: any, path: string[] = []) {
  const flatten: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    let keyPath = [...path, key];
    if (value) {
      flatten[keyPath.join('-')] = value;
    }
    if (key === 'DEFAULT') {
      keyPath = path;
      if (value) {
        flatten[path.join('-')] = value;
      }
    }
    if (typeof value === 'object') {
      Object.assign(flatten, flattenObjectByPath(value, keyPath));
    }
  }
  return flatten;
}

export function flattenColorPalette(
  colors: ColorsRecord,
  path: string[] = [],
): Record<string, string> {
  const flatten: Record<string, string> | ColorsRecord = {};

  for (const key in colors) {
    const value = colors[key];

    let keyPath = [...path, key];
    if (value) {
      flatten[keyPath.join('-')] = value;
    }

    if (key === 'DEFAULT') {
      keyPath = path;
      if (value) {
        flatten[path.join('-')] = value;
      }
    }

    if (typeof value === 'object') {
      Object.assign(flatten, flattenColorPalette(value, keyPath));
    }
  }

  return flatten as any;
}

// type ConvertUndefined<T> = OrUndefined<{ [K in keyof T as undefined extends T[K] ? K : never]-?: T[K] }>
// type OrUndefined<T> = { [K in keyof T]: T[K] | undefined }
// type PickRequired<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] }
// type ConvertPick<T> = ConvertUndefined<T> & PickRequired<T>

/** Returns a shallowly cloned object with the provided keys omitted */
export const omit = <Obj extends object, Keys extends keyof Obj>(
  obj: Obj,
  keys: Keys[],
): Omit<Obj, Keys> => {
  return Object.keys(obj).reduce((acc, key: any) => {
    if (!keys.includes(key)) {
      acc[key] = (obj as any)[key];
    }
    return acc;
  }, {} as any);
};

type ConvertUndefined<T> = OrUndefined<{
  [K in keyof T as undefined extends T[K] ? K : never]-?: T[K];
}>;
type OrUndefined<T> = { [K in keyof T]: T[K] | undefined };
type PickRequired<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] };
type ConvertPick<T> = ConvertUndefined<T> & PickRequired<T>;

export const pick = <Obj, Keys extends keyof Obj>(
  obj: Obj,
  keys: Keys[],
  /** Whether to filter out explicit `undefined` values */
  filterUndefined = true,
): ConvertPick<{ [K in Keys]: Obj[K] }> => {
  return keys.reduce((acc, key) => {
    const val = obj[key];
    if (val === undefined && filterUndefined) return acc;

    acc[key] = val;

    return acc;
  }, {} as any);
};
