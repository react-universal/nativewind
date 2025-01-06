import { useCallback, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';

const data = [
  {
    id: 0,
    label: 'label',
  },
];

const FlatListScreen = () => {
  const [items, setItems] = useState(data);

  const addItem = useCallback(() => {
    setItems((prevState) => [
      ...prevState,
      {
        id: prevState.length,
        label: `Item - ${prevState.length}`,
      },
    ]);
  }, []);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className='flex-1'>
        <Pressable onPress={addItem} className='bg-gray-400'>
          <Text>Add item</Text>
        </Pressable>
        <FlatList
          data={items}
          className='bg-gray-600 hover:bg-white p-10'
          // className -> contentContainerStyle
          // indicatorClassName -> indicatorStyle
          renderItem={({ item }) => {
            return (
              <View className='hover:bg-pink-500'>
                <Text>{item.label}</Text>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export { FlatListScreen };
