// @ts-noCheck
import { useState } from 'react';
import { Text, View } from 'react-native';
import 'globals.css';

const Button = () => {
  return (
    <View className='bg-[#000] last:hover:text-[20vw] odd:text-[10px] even:text-[30px]'>
      <Text className='font-medium'>Text1</Text>
      <Text className={`${true ? 'text-medium' : 'text-bold'}`}>Text3</Text>
      <View>
        <Span>Hallo</Span>
      </View>
    </View>
  );
};

export { ChildProp };
