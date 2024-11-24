import './global.css';
import { Text, View } from 'react-native';
import { setup } from '@native-twin/core';
import { HomeScreen } from './src/screens/Home.screen';
import tailwindConfig from './tailwind.config';

setup(tailwindConfig);
export default function App() {
  return (
    <View className='bg-blue-800 flex-1 items-center justify-center first:bg-green'>
      <HomeScreen />
      <View
        className={`
          w-[80vw] h-[20vh] rounded-full justify-center items-center bg-purple-200
          last:bg-purple border-1 border-white
          hover:bg-red
          ${true && 'h-[50vh]'}
        `}
      >
        <Text>asd</Text>
        <View>
          <Text>asdsad2</Text>
        </View>
      </View>
    </View>
  );
}
