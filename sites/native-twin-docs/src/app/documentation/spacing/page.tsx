import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { gapData, paddingData } from './dataSpacing';

export default function SpacingPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Padding and Margin'
        id='paddingMargin'
        Data={tailwindClasses.spacing.paddingMargin}
      ></HeaderDocsTop>
      <ClassToRenderer list={paddingData}></ClassToRenderer>
      <HeaderDocsTop
        title='Gap'
        id='gap'
        Data={tailwindClasses.spacing.gap}
      ></HeaderDocsTop>
      <ClassToRenderer list={gapData}></ClassToRenderer>
    </div>
  );
}
