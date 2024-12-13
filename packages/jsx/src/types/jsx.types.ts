import type { RuntimeComponentEntry, RuntimeSheetEntry } from '@native-twin/css/jsx';
import type React from 'react';

export interface JSXInternalProps extends Record<string, any> {
  twEnabled?: boolean;
  _twinComponentID?: string;
  _twinComponentSheet: RuntimeComponentEntry[];
  _twinComponentTemplateEntries: ComponentTemplateEntryProp[];
}

export type JSXFunction = (
  type: React.ComponentType,
  props: JSXInternalProps | undefined | null,
  key?: React.Key,
  isStaticChildren?: boolean,
  __source?: unknown,
  __self?: unknown,
) => React.ElementType;

export interface ComponentTemplateEntryProp {
  id: string;
  prop: string;
  target: string;
  entries: RuntimeSheetEntry[];
}
