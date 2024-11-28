import { useMemo, useSyncExternalStore } from 'react';
import { getParentComponentState, globalStore, registerComponent } from '../styled/store.js';

interface RegisterComponent {
  parentID: string | undefined;
  groupID: string | undefined;
  componentID: string;
  isGroupParent: boolean;
}

export function useComponentRegistry({
  componentID,
  groupID,
  parentID,
  isGroupParent,
}: RegisterComponent) {
  const currentGroupID = useMemo(() => {
    return groupID ? groupID : parentID ?? componentID;
  }, [groupID, parentID, componentID]);

  const groupScope = currentGroupID === componentID ? componentID : currentGroupID;

  const component = useSyncExternalStore(
    globalStore.subscribe,
    () =>
      registerComponent({
        groupID: isGroupParent ? componentID : currentGroupID,
        id: componentID,
      }),
    () =>
      registerComponent({
        groupID: isGroupParent ? componentID : currentGroupID,
        id: componentID,
      }),
  );

  const parentComponent = useSyncExternalStore(
    globalStore.subscribe,
    () => getParentComponentState(groupScope),
    () => getParentComponentState(groupScope),
  );
  return { component, parentComponent, currentGroupID };
}
