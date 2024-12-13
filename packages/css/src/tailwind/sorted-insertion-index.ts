import { Layer } from '../css/precedence.js';
import type { SheetEntry } from '../sheets/sheet.types.js';

const collator = new Intl.Collator('en', { numeric: true });

/**
 * Find the array index of where to add an element to keep it sorted.
 *
 * @returns The insertion index
 */
export function sortedInsertionIndex(
  array: readonly SheetEntry[],
  element: SheetEntry,
): number {
  // Find position using binary search
  for (var low = 0, high = array.length; low < high; ) {
    const pivot = (high + low) >> 1;

    // Less-Then-Equal to add new equal element after all existing equal elements (stable sort)
    if (array[pivot] && compareTwRules(array[pivot]!, element) <= 0) {
      low = pivot + 1;
    } else {
      high = pivot;
    }
  }
  return high;
}

export function compareTwRules(a: SheetEntry, b: SheetEntry): number {
  // base and overrides (css) layers are kept in order they are declared
  const layer = a.precedence & Layer.o;
  // console.log('LAYER: ', layer);
  if (layer === (b.precedence & Layer.o) && (layer === Layer.b || layer === Layer.o)) {
    return 0;
  }
  return (
    a.precedence - b.precedence ||
    // a.o - b.o ||
    collator.compare(byModifier(a.className), byModifier(b.className)) ||
    collator.compare(byName(a.className), byName(b.className))
  );
}

function byModifier(s: string | null | undefined) {
  return ((s || '').split(/:/).pop() as string).split('/').pop() || '\x00';
}

function byName(s: string | null | undefined) {
  return `${(s || '').replace(/\W/g, (c) => String.fromCharCode(127 + c.charCodeAt(0)))}\x00`;
}
