'use client';

import { Text, View } from 'react-native';

// export function getServerSideProps(): GetServerSidePropsResult<any> {
//   return { props: { asd: 1 } };
// }

const IndexPage = () => {
  return (
    <View className={'items-center justify-center bg-gray-900 flex-1'}>
      <View className='bg-slate-300 px-8 justify-center ios:items-center py-5 rounded-xl group'>
        <Text className='text(4xl group-hover:(blue-200) sm:5xl) font-bold scale-100 first-letter:mx-10'>
          Card title
        </Text>
        <View>
          <Text className={'text(2xl gray-100) hover:font-bold'}>Subtitle</Text>
          <Text className={'text(lg) text-red-500 min-w-full'}>Card description</Text>
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
