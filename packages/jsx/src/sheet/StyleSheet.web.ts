import type { SheetEntry } from '@native-twin/css';
import type { StyledContext } from '../store/observables/styles.obs.js';
import { INTERNAL_FLAGS, INTERNAL_RESET } from '../utils/constants.js';
import type { TwinStyleSheet } from './StyleSheet.js';

// TODO: Check this on every react web fmw
const internalSheet: TwinStyleSheet = {
  [INTERNAL_FLAGS]: {},
  [INTERNAL_RESET]() {
    // vw[INTERNAL_RESET](dimensions);
    // vh[INTERNAL_RESET](dimensions);
    // colorScheme[INTERNAL_RESET](appearance);
  },
  getFlag(name: string) {
    return this[INTERNAL_FLAGS][name];
  },
  getGlobalStyle(name) {
    return undefined;
  },
  // @ts-expect-error
  get runtimeContext() {
    return {};
  },
  create(a: any) {
    return a;
  },
};

export const StyleSheet = Object.assign({}, internalSheet);

export function createComponentSheet(
  entries: SheetEntry[] = [],
  context: StyledContext,
) {}

export type ComponentSheet = ReturnType<typeof createComponentSheet>;
