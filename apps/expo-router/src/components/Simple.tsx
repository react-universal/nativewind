import { Text, View } from 'react-native';

export const SimpleComponent = () => {
  return (
    <View className='flex-1 bg-blue-200 items-center justify-center'>
      <View className='group'>
        <View className='group-hover:m-4 bg-white p-8'>
          <Text className='group-hover:text-blue-300 font-inter-bold text-xl text-red'>
            Text-333
          </Text>
        </View>
      </View>
      <View className='m-2 rounded-lg bg-red-500 p-8'>
        <Text className='text-sm text-gray-800'>Text-2</Text>
      </View>
    </View>
  );
};
