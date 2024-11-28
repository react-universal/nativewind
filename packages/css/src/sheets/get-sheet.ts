import { createCssomSheet } from './cssom.sheet.js';
import { createDomSheet } from './dom.sheet.js';
import type { Sheet, SheetEntry } from './sheet.types.js';
import { createVirtualSheet } from './virtual.sheet.js';

/**
 * Returns a sheet useable in the current environment.
 *
 * @group Sheets
 * @param useDOMSheet usually something like `process.env.NODE_ENV != 'production'` or `import.meta.env.DEV` (default: browser={@link cssom}, server={@link virtual})
 * @param disableResume to not include or use resume data
 * @returns a sheet to use
 */
export function getSheet(
  useDOMSheet?: boolean,
): Sheet<SheetEntry[] | HTMLStyleElement | CSSStyleSheet> {
  const sheet =
    typeof document === 'undefined'
      ? createVirtualSheet()
      : useDOMSheet
        ? createDomSheet()
        : createCssomSheet();

  return sheet;
}
