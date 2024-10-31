import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { dataTransform } from './dataTransform';

export default function TransformationsPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        id='transform'
        title='Transform'
        Data={tailwindClasses.transformations.transform}
      ></HeaderDocsTop>
      <ClassToRenderer list={dataTransform} />
    </div>
  );
}
