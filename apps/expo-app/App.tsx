import './global.css';
import { Text, View } from 'react-native';
import { setup } from '@native-twin/core';
import tailwindConfig from './tailwind.config';

setup(tailwindConfig);
// console.log('ccc. ', config.config);
export default function App() {
  return (
    <View className='bg-gray-900 flex-1 items-center justify-center first:bg-green'>
      <View
        className={`
          w-[80vw] h-[20vh] rounded-full justify-center items-center bg-purple-200
          last:bg-purple border-1 border-white
          hover:bg-red
          ${true && 'h-[50vh]'}
        `}
      >
        <Text className='text-3xl'>asd</Text>
        <View>
          <Text>asdsad2</Text>
        </View>
      </View>
    </View>
  );
}
