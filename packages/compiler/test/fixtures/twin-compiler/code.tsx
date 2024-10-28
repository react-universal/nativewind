// @ts-noCheck
import { useState } from 'react';
import { Text, View } from 'react-native';
import 'globals.css';

const ChildProp = () => {
  return (
    <View className='first:bg-blue-600'>
      <View
        className={`
          group
          flex-[2] items-center justify-center
          bg-blue-800 hover:bg-red-600
        `}
      >
        <Text className=''>Text1</Text>
      </View>
      <View className=''>
        <Text className=''>Text2</Text>
      </View>
    </View>
  );
};

const Button = () => {
  return (
    <View className='bg-black last:text-lg odd:text-gray-200 even:text-yellow-200'>
      <Text className='font-medium'>Text1</Text>
      <Text className='font-bold'>Text2</Text>
      <Text className={`${true ? 'text-medium' : 'text-bold'}`}>Text3</Text>
    </View>
  );
};

export { ChildProp };
