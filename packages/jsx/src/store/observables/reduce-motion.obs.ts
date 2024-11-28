import { AccessibilityInfo } from 'react-native';
import { INTERNAL_RESET } from '../../utils/constants.js';
import { atom } from '@native-twin/helpers/react';

/**
 * isReduceMotionEnabled
 */
export const isReduceMotionEnabled = Object.assign(atom<boolean>(false), {
  [INTERNAL_RESET]: () => isReduceMotionEnabled.set(false),
});
// Hopefully this resolves before the first paint...
AccessibilityInfo.isReduceMotionEnabled()?.then(isReduceMotionEnabled.set);
AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  isReduceMotionEnabled.set(value);
});
