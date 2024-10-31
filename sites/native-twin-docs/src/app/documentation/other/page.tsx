import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { dataVisibility, ObjectProperties } from './dataOther';

export default function OtherPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Visibility'
        Data={tailwindClasses.others.visibility}
        id='visibility'
      ></HeaderDocsTop>
      <ClassToRenderer list={dataVisibility}></ClassToRenderer>
      <HeaderDocsTop
        title='Object Properties'
        Data={tailwindClasses.others.objectProperties}
        id='objectProperties'
      ></HeaderDocsTop>
      <ClassToRenderer list={ObjectProperties}></ClassToRenderer>
    </div>
  );
}
