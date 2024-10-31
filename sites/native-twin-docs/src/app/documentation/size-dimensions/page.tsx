import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { dataResize, dataSize } from './dataSize';

export default function SizeDimensionsPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Dimensions'
        id='dimensions'
        Data={tailwindClasses.sizeDimensions.dimensions}
      ></HeaderDocsTop>
      <ClassToRenderer list={dataSize}></ClassToRenderer>

      <HeaderDocsTop
        title='Resize'
        id='resize'
        Data={tailwindClasses.sizeDimensions.resize}
      ></HeaderDocsTop>
      <ClassToRenderer list={dataResize}></ClassToRenderer>
    </div>
  );
}
