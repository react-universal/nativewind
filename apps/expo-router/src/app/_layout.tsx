import { View } from 'react-native';
import { Slot } from 'expo-router';
import { install } from '@native-twin/core';
import config from '../../tailwind.config';
import { useLoadFonts } from '../hooks/useLoadFonts';
import '../../globals.css';

install(config, !__DEV__);

export default function Layout() {
  const { loaded } = useLoadFonts();
  if (!loaded) return null;
  return (
    <View className='bg-gray w-screen h-screen'>
      <Slot />
    </View>
  );
}
