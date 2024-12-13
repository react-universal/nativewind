import './twin.css';
import { useLoadFonts } from '@/features/app/useLoadFonts';
import { install } from '@native-twin/core';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import config from '../../tailwind.config';

install(config, !__DEV__);

export default function Layout() {
  const { loaded } = useLoadFonts();
  if (!loaded) return null;
  return (
    <View className='bg-gray-200 w-screen h-screen'>
      <Slot />
    </View>
  );
}
