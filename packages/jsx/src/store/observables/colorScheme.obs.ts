import { atom } from '@native-twin/helpers/react';
import { AppState, Appearance, type NativeEventSubscription } from 'react-native';

export const colorScheme = atom(Appearance.getColorScheme() ?? 'light');

/**
 * Appearance
 */
let appearance = Appearance;
let appearanceListener: NativeEventSubscription | undefined;
let appStateListener: NativeEventSubscription | undefined;

function resetAppearanceListeners(
  $appearance: typeof Appearance,
  appState: typeof AppState,
) {
  appearance = $appearance;
  appearanceListener?.remove();
  appStateListener?.remove();

  appearanceListener = appearance.addChangeListener((state) => {
    if (AppState.currentState === 'active') {
      colorScheme.set(state.colorScheme ?? 'light');
    }
  });

  appStateListener = appState.addEventListener('change', (type) => {
    if (type === 'active') {
      colorScheme.set(appearance.getColorScheme() ?? 'light');
    }
  });
}
resetAppearanceListeners(appearance, AppState);
