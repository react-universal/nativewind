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
