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
  return <View className={`group flex-1 first:bg-red-200`} _twinComponentID={"1625619362:0"} _twinOrd={-1} _twinComponentSheet={[{
    id: "1625619362:0",
    target: "style",
    prop: "className",
    entries: [{
      className: "group",
      declarations: [],
      selectors: [],
      precedence: 805306368,
      important: false,
      animations: [],
      preflight: false
    }, {
      className: "flex-1",
      declarations: [{
        prop: "flex",
        value: {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "0%"
        },
        _tag: "COMPILED"
      }],
      selectors: [],
      precedence: 805306368,
      important: false,
      animations: [],
      preflight: false
    }, {
      className: "first:bg-red-200",
      declarations: [{
        prop: "backgroundColor",
        value: "rgba(254,202,202,1)",
        _tag: "COMPILED"
      }],
      selectors: ["first", "&:first"],
      precedence: 805437440,
      important: false,
      animations: [],
      preflight: false
    }],
    templateLiteral: ``,
    templateEntries: null,
    rawSheet: {
      base: [{
        className: "flex-1",
        declarations: [{
          prop: "flex",
          value: {
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: "0%"
          },
          _tag: "COMPILED"
        }],
        selectors: [],
        precedence: 805306368,
        important: false,
        animations: [],
        preflight: false
      }],
      dark: [],
      pointer: [],
      group: [],
      even: [],
      first: [{
        className: "first:bg-red-200",
        declarations: [{
          prop: "backgroundColor",
          value: "rgba(254,202,202,1)",
          _tag: "COMPILED"
        }],
        selectors: ["first", "&:first"],
        precedence: 805437440,
        important: false,
        animations: [],
        preflight: false
      }],
      last: [],
      odd: []
    }
  }]}>
      <Text _twinComponentID={"1625619362:0:0"} _twinOrd={0} _twinComponentSheet={[{
      id: "1625619362:0:0",
      target: "style",
      prop: "className",
      entries: [],
      templateLiteral: null,
      templateEntries: null,
      rawSheet: {
        base: [{
          className: "first:bg-red-200",
          declarations: [{
            prop: "backgroundColor",
            value: "rgba(254,202,202,1)",
            _tag: "COMPILED"
          }],
          selectors: ["first", "&:first"],
          precedence: 805437440,
          important: false,
          animations: [],
          preflight: false
        }],
        dark: [],
        pointer: [],
        group: [],
        even: [],
        first: [],
        last: [],
        odd: []
      }
    }]}>Hello World</Text>
      {/* <Text>Hello World</Text> */}
      {/* <Button size='small' /> */}
      {/* <View className='flex-1 first:bg-blue-200'>
        <Text className='text-lg'>Test Text</Text>
        <Text className='text-lg'>Test Text2</Text>
       </View> */}
    </View>;
}