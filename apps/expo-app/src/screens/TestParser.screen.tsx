import { cx } from '@native-twin/core';
import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

const TextField = () => {
  const [text, setText] = useState('');
  return (
    <TextInput
      value={text}
      onChangeText={(data) => setText(data)}
      className='min-w-[25vw] bg-pink-400 focus:bg-white'
    />
  );
};

const testImage = require('../../assets/favicon.png');

function HomeScreen() {
  const [_, setActive] = useState(false);
  return (
    <View className='flex-1'>
      <View
        className={cx(
          'flex-1',
          'hover:(bg-red-300 web:(bg-blue-600) ios:(bg-pink-600) android:(bg-black))',
          'ios:(p-14 border-gray-200)',
          'items-center justify-center',
        )}
      />
      <View
        className={cx(
          'group',
          'flex-[2]',
          'bg-gray-800 hover:bg-pink-600',
          'items-center justify-center',
        )}
      >
        <Pressable
          onPressIn={() => {
            setActive((prevState) => !prevState);
          }}
        >
          <Text className='text-gray-200'>Activate</Text>
        </Pressable>
        <Image
          source={testImage}
          resizeMode='cover'
          className='-translate-x-[10px] rounded-full border-1'
        />
        <TextField />
        <View className='mb-2 -top-1 -translate-x-2 rounded-lg bg-gray-300 p-2 group-hover:bg-pink-800'>
          <Text
            suppressHighlighting
            className='font-inter-bold text-xl text-gray-800 group-hover:text-white -mt-2'
          >
            Deeply nested hover
          </Text>
        </View>
      </View>
    </View>
  );
}

export { HomeScreen };
