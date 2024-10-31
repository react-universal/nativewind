import React from 'react';
import { Code } from '../components/Code';
import { SubTitle } from '../components/SubTitle';
import { Text } from '../components/Text';

export interface classRenderer {
  title: string;
  code: string;
  text: string;
}
export const ClassToRenderer = ({ list }: { list: classRenderer[] }) => {
  return (
    <>
      {list.map((item, key) => {
        return (
          <div key={item.title + key} className='flex flex-col gap-5'>
            <SubTitle>{item.title} </SubTitle>
            <Text>{item.text}</Text>
            <Code codeString={item.code}></Code>
          </div>
        );
      })}
    </>
  );
};
