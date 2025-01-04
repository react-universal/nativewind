import { composeDeclarations } from '@native-twin/core';
import type { TwinInjectedProp } from '@native-twin/css/jsx';
import { atom, useAtom, useAtomValue } from '@native-twin/helpers/react';
import { useCallback, useContext, useId, useMemo, useRef } from 'react';
import type {
  NativeSyntheticEvent,
  PressableProps,
  TextInputFocusEventData,
  Touchable,
} from 'react-native';
import { groupContext } from '../../context/styled.context.js';
import { StyleSheet } from '../../sheet/StyleSheet.js';
import { styledContext } from '../../store/observables';
import type { JSXInternalProps } from '../../types/jsx.types.js';
import type { ComponentConfig } from '../../types/styled.types.js';
import { DEFAULT_INTERACTIONS } from '../../utils/constants.js';

export const useStyledProps = (props: JSXInternalProps, configs: ComponentConfig[]) => {
  const injectedProps: TwinInjectedProp | undefined = props?.['_twinInjected'];
  const reactID = useId();
  const id = injectedProps?.id ?? reactID;
  const styledCtx = useAtomValue(styledContext);
  const handlers: Touchable & PressableProps = {};
  const [state, setState] = useAtom(StyleSheet.getComponentState(id));

  const componentHandler = useMemo(() => {
    return StyleSheet.getComponentByID(id, injectedProps?.templateEntries);
  }, [props]);

  const context = useContext(groupContext);
  const parentState = useAtomValue(
    atom((get) => {
      if (!context || !componentHandler.metadata.isGroupParent) {
        return DEFAULT_INTERACTIONS;
      }
      return get(StyleSheet.getComponentState(context)).interactions;
    }),
  );

  const interactionsRef = useRef<
    Touchable &
      PressableProps & {
        onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
        onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
      }
  >(props as any);

  const onChange = useCallback(
    (active: boolean) => {
      if (
        componentHandler.metadata.hasPointerEvents ||
        componentHandler.metadata.isGroupParent
      ) {
        setState({
          interactions: {
            isLocalActive: active,
            isGroupActive: active,
          },
          meta: state.meta,
        });
      }
    },
    [componentHandler, setState, state],
  );

  if (
    componentHandler.metadata.hasPointerEvents ||
    componentHandler.metadata.hasGroupEvents ||
    componentHandler.metadata.isGroupParent
  ) {
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

  const compiledProps = useMemo(() => {
    return componentHandler.props.map(({ prop, target, declarations }) => {
      const compileDecls = [...declarations.base];

      if (state.interactions.isLocalActive) compileDecls.push(...declarations.pointer);
      if (state.interactions.isGroupActive) compileDecls.push(...declarations.group);

      const styles = composeDeclarations(compileDecls, styledCtx);
      return {
        prop,
        target,
        styles,
      };
    });
  }, [componentHandler, styledCtx, state.interactions, parentState]);

  return { componentHandler, compiledProps, handlers, styledCtx, parentState };
};
