import {
  componentsStore,
  unsafeGetTreeComponentByKey,
} from '@/features/app/store/components.store';
import JsonTreeSvgView from '@/features/json-tree/JsonTree';
import { useLocalSearchParams } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { View } from 'react-native';

export default function TreeScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const node = useSyncExternalStore(
    componentsStore.subscribe,
    () => unsafeGetTreeComponentByKey(id),
    () => unsafeGetTreeComponentByKey(id),
  );

  if (!node) return null;
  return <View className='flex-1'>{<JsonTreeSvgView node={node} />}</View>;
}
