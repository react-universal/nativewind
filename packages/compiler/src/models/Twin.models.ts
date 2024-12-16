import type { RuntimeTW, TailwindConfig, __Theme__ } from '@native-twin/core';
import type { SelectorGroup, SheetEntry } from '@native-twin/css';
import type { TailwindPresetTheme } from '@native-twin/preset-tailwind';
import type { AbsoluteFilePath } from '../internal/fs/fs.path';

export interface PartialRule extends SheetEntry {
  group: SelectorGroup;
}

export type InternalTwinConfig = __Theme__ & TailwindPresetTheme;
export type InternalTwFn = RuntimeTW<InternalTwinConfig, SheetEntry[]>;
export interface ExtractedTwinConfig extends TailwindConfig<InternalTwinConfig> {
  content: AbsoluteFilePath[];
}
export type ImportedTwinConfig = TailwindConfig<InternalTwinConfig>;
