import type { ComponentSheet } from '@native-twin/css/jsx';
import { atom, useAtom, useAtomValue } from '@native-twin/helpers/react';
import { useCallback, useContext } from 'react';
import { groupContext } from '../../context/index.js';
import { getTwinComponent } from '../../store/components.store.js';
import { DEFAULT_INTERACTIONS } from '../../utils/constants.js';

export const useTwinComponent = (
  id: string,
  styledProps: [string, ComponentSheet][] = [],
) => {
  const context = useContext(groupContext);

  const [state, setState] = useAtom(getTwinComponent(id, styledProps));

  const parentState = useAtomValue(
    atom((get) => {
      if (!context || !state.meta.hasGroupEvents) {
        return DEFAULT_INTERACTIONS;
      }
      return get(getTwinComponent(context)).interactions;
    }),
  );

  const onChange = useCallback(
    (active: boolean) => {
      if (state.meta.hasPointerEvents || state.meta.isGroupParent) {
        state.interactions = {
          isLocalActive: active,
          isGroupActive: active,
        };
        setState({ ...state });
      }
    },
    [state, setState],
  );

  // console.log('Render_Count', ++useRef(0).current);

  return {
    state,
    id,
    onChange,
    parentState,
  };
};
