'use client';

import { ReactNode } from 'react';
import { View } from 'react-native';
// import { useServerInsertedHTML } from 'next/navigation';
// import { install, TailwindUserConfig } from '@native-twin/core';
// import { sheetEntriesToCss, SheetEntry } from '@native-twin/css';
import { NativeTwinSheet } from '@native-twin/adapters/next/app';
import tailwindConfig from '../../tailwind.config';

// export default installApp(tailwindConfig, NativeTwin);

const TwinComponentProvider = NativeTwinSheet(tailwindConfig);

export const NativeTwinWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <TwinComponentProvider>
      <View className='flex-1 h-full'>{children}</View>
    </TwinComponentProvider>
  );
};
