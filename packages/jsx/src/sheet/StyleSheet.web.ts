import type { SheetEntry } from '@native-twin/css';
import type { StyledContext } from '../store/observables/styles.obs.js';
import { INTERNAL_FLAGS, INTERNAL_RESET } from '../utils/constants.js';

// TODO: Check this on every react web fmw
const internalSheet = {
  [INTERNAL_FLAGS]: {},
  [INTERNAL_RESET]() {
    // vw[INTERNAL_RESET](dimensions);
    // vh[INTERNAL_RESET](dimensions);
    // colorScheme[INTERNAL_RESET](appearance);
  },
  getFlag(name: string) {
    // @ts-expect-error
    return this[INTERNAL_FLAGS][name];
  },
  getGlobalStyle(_name: string) {
    return undefined;
  },
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
