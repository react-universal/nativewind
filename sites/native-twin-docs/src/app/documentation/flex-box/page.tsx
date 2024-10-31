import { SubTitle } from '@/feactures/documentation/components/SubTitle';
import { Text } from '@/feactures/documentation/components/Text';
import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { dataFlex } from './flexData';

export default function FlexboxPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Flex'
        Data={tailwindClasses.flexbox.flexProperties}
        id='flexProperties'
      ></HeaderDocsTop>
      <SubTitle>Flex</SubTitle>
      <Text>
        Use flex-initial to allow a flex item to shrink but not grow, taking into account
        its initial size:
      </Text>
      <ClassToRenderer list={dataFlex}></ClassToRenderer>
    </div>
  );
}
