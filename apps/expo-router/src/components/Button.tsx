import { type VariantProps, createVariants } from '@native-twin/core';
import { Pressable, type PressableProps, Text } from 'react-native';

// css`bg`;
// styled('')``

const buttonVariants = createVariants({
  base: 'py-5 m-1 rounded-md items-center justify-center group-hover:bg-red-400',
  variants: {
    variant: {
      primary: 'bg-blue-200',
      secondary: 'bg-white',
    },
    size: {
      large: 'w-40',
      small: 'w-20',
    },
    isDisable: {
      true: 'opacity-30',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});
type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type ButtonProps = ButtonVariantProps & PressableProps;

export const Button = (props: ButtonProps) => {
  return (
    <Pressable className={buttonVariants(props)}>
      <Text className='group-hover:text-white font-medium'>asd</Text>
    </Pressable>
  );
};
