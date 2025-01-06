import { createElement } from 'react';
import jsxWrapper from './jsx-wrapper.web.js';

export {
  withMappedProps,
  createStylableComponent,
  stylizedComponents,
} from './styled/index.web.js';
export { getSheetEntryStyles } from './utils/sheet.utils.js';

// export const createTwinElement = jsxWrapper(createElement as any);

export const createTwinElement = jsxWrapper(createElement as any);

export { createElement };
