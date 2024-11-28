import type { FinalSheet } from '../react-native/rn.types.js';
import type { ChildsSheet } from './Sheet.js';

export const defaultSheetMetadata = {
  hasAnimations: false,
  hasGroupEvents: false,
  hasPointerEvents: false,
  isGroupParent: false,
};

export const emptyChildsSheet: ChildsSheet = {
  first: [],
  last: [],
  even: [],
  odd: [],
};

export const defaultFinalSheet: FinalSheet = {
  base: {},
  even: {},
  first: {},
  group: {},
  last: {},
  odd: {},
  pointer: {},
  dark: {},
};
