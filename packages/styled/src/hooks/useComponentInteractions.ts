import { useMemo, useRef } from 'react';
import type {
  NativeSyntheticEvent,
  Touchable,
  TextInputFocusEventData,
  PressableProps,
} from 'react-native';
import { setComponentInteractionState } from '../styled/store.js';

interface UseComponentInteractionsArgs {
  props: Touchable;
  hasPointerInteractions: boolean;
  isGroupParent: boolean;
  hasGroupInteractions: boolean;
  id: string;
}

export interface InternalTouchable extends Touchable {
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
}

const useComponentInteractions = ({
  props,
  hasPointerInteractions,
  isGroupParent,
  hasGroupInteractions,
  id,
}: UseComponentInteractionsArgs) => {
  const ref = useRef<
    Touchable &
      PressableProps & {
        onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
        onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
      }
  >(props);

  const componentInteractionHandlers = useMemo(() => {
    const handlers: Touchable & PressableProps = {};
    if (hasPointerInteractions || isGroupParent || hasGroupInteractions) {
      handlers.onTouchStart = function (event) {
        if (ref.current.onTouchStart) {
          ref.current.onTouchStart(event);
        }
        if (hasPointerInteractions) {
          setComponentInteractionState(id, 'hover', true);
        }
        if (isGroupParent) {
          setComponentInteractionState(id, 'group-hover', true);
        }
      };

      handlers.onTouchEnd = function (event) {
        if (ref.current.onTouchEnd) {
          ref.current.onTouchEnd(event);
        }
        if (isGroupParent) {
          setComponentInteractionState(id, 'group-hover', false);
        }
        if (hasPointerInteractions) {
          setComponentInteractionState(id, 'hover', false);
        }
      };
    }
    return handlers;
  }, [id, isGroupParent, hasGroupInteractions, hasPointerInteractions]);

  const focusHandlers = useMemo(() => {
    const handlers: InternalTouchable = {};
    if (hasPointerInteractions) {
      handlers.onFocus = function (event) {
        if (ref.current.onFocus) {
          ref.current.onFocus(event);
        }
        setComponentInteractionState(id, 'focus', true);
      };
      handlers.onBlur = function (event) {
        if (ref.current.onBlur) {
          ref.current.onBlur(event);
        }
        setComponentInteractionState(id, 'focus', false);
      };
    }
    return handlers;
  }, [hasPointerInteractions, id]);

  return {
    componentInteractionHandlers,
    focusHandlers,
  };
};

export { useComponentInteractions };
