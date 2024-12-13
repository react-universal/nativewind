import type { RegisteredComponent } from '@native-twin/css/jsx';
import { atom, useAtom, useAtomValue } from '@native-twin/helpers/react';
import { useCallback, useContext, useRef } from 'react';
import type {
  NativeSyntheticEvent,
  PressableProps,
  TextInputFocusEventData,
  Touchable,
} from 'react-native';
import { groupContext } from '../../context/index.js';
import { StyleSheet } from '../../sheet/index.js';
import { DEFAULT_INTERACTIONS } from '../../utils/constants.js';

export const useInteractions = (
  id: string,
  metadata: RegisteredComponent['metadata'],
  props: any,
) => {
  const [state, setState] = useAtom(StyleSheet.getComponentState(id));
  const context = useContext(groupContext);
  const parentState = useAtomValue(
    atom((get) => {
      if (!context || !metadata.hasGroupEvents) {
        return DEFAULT_INTERACTIONS;
      }
      return get(StyleSheet.getComponentState(context));
    }),
  );
  const interactionsRef = useRef<
    Touchable &
      PressableProps & {
        onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
        onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
      }
  >(props);

  const handlers: Touchable & PressableProps = {};

  const onChange = useCallback(
    (active: boolean) => {
      if (metadata.hasPointerEvents || metadata.isGroupParent) {
        setState({
          isLocalActive: active,
          isGroupActive: active,
        });
      }
    },
    [metadata.hasPointerEvents, metadata.isGroupParent, setState],
  );

  // TODO: Create the focus handler
  if (metadata.hasPointerEvents || metadata.hasGroupEvents || metadata.isGroupParent) {
    handlers.onTouchStart = (event) => {
      if (interactionsRef.current.onTouchStart) {
        interactionsRef.current.onTouchStart(event);
      }
      onChange(true);
    };
    handlers.onTouchEnd = (event) => {
      if (interactionsRef.current.onTouchEnd) {
        interactionsRef.current.onTouchEnd(event);
      }
      onChange(false);
    };
  }

  return { handlers, state, parentState };
};
