import { atom } from '@native-twin/helpers/react';
import { Dimensions } from 'react-native';

/**
 * ViewPort
 */
export const viewport = atom(Dimensions.get('window'));

let windowEventSubscription: ReturnType<typeof Dimensions.addEventListener>;
const viewportReset = (dimensions: Dimensions) => {
  viewport.set(dimensions.get('window'));
  windowEventSubscription?.remove();
  windowEventSubscription = dimensions.addEventListener('change', (size) => {
    return viewport.set(size.window);
  });
};
viewportReset(Dimensions);

export const vw = atom((get) => get(viewport).width);
export const vh = atom((get) => get(viewport).height);
