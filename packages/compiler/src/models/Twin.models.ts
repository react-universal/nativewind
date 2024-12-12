import type { RuntimeTW, TailwindConfig, __Theme__ } from '@native-twin/core';
import type { SelectorGroup, SheetEntry } from '@native-twin/css';
import type { TailwindPresetTheme } from '@native-twin/preset-tailwind';

export interface PartialRule extends SheetEntry {
  group: SelectorGroup;
}

export type InternalTwinConfig = __Theme__ & TailwindPresetTheme;
export type InternalTwFn = RuntimeTW<InternalTwinConfig, SheetEntry[]>;
export type ExtractedTwinConfig = TailwindConfig<InternalTwinConfig>;
// export class ExtractedTwinConfig {
//   private _currentConfig: Option.Option<TailwindConfig<InternalTwinConfig>> =
//     Option.none();

//   constructor(readonly configPath: string) {}

//   get currentConfig() {
//     return extractTwinConfig(this.configPath);
//   }
// }
