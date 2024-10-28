// @ts-noCheck
// import { View, Text } from 'react-native';
// import { Button as Button2 } from './code-i';

// const { Button: Button3 } = require('./code-i');

// const buttonVariants = createVariants({
//   base: 'py-5 m-1 rounded-md items-center justify-center group-hover:bg-red-400',
//   variants: {
//     variant: {
//       primary: 'bg-blue-200',
//       secondary: 'bg-white',
//     },
//     size: {
//       large: 'w-40',
//       small: 'w-4',
//     },
//     isDisable: {
//       true: 'opacity-30',
//       false: '',
//     },
//   },
//   defaultVariants: {
//     variant: 'primary',
//   },
// });

// export const Button = (props) => {
//   return (
//     <Pressable className={buttonVariants(props)}>
//       <Text className='group-hover:text-white'>asd</Text>
//     </Pressable>
//   );
// };

export default function App() {
  return (
    <View className={`group flex-1 first:bg-red-200`}>
      <Text>Hello World</Text>
      {/* <Text>Hello World</Text> */}
      {/* <Button size='small' /> */}
      {/* <View className='flex-1 first:bg-blue-200'>
        <Text className='text-lg'>Test Text</Text>
        <Text className='text-lg'>Test Text2</Text>
      </View> */}
    </View>
  );
}
