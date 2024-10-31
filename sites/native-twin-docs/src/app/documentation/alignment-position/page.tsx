import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import {
  alignContent,
  alignItems,
  alignmentData,
  alignSelf,
  justifyItems,
  justifySelf,
  position,
  positionLaterals,
} from './dataAlignment';

export default function AlignmentPosition() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Alignment'
        id='alignment'
        Data={tailwindClasses.alignmentPositioning.alignment}
      ></HeaderDocsTop>
      <ClassToRenderer list={alignmentData}></ClassToRenderer>
      <ClassToRenderer list={justifyItems}></ClassToRenderer>
      <ClassToRenderer list={justifySelf}></ClassToRenderer>

      <ClassToRenderer list={alignItems}></ClassToRenderer>
      <ClassToRenderer list={alignSelf}></ClassToRenderer>
      <ClassToRenderer list={alignContent}></ClassToRenderer>
      <HeaderDocsTop
        title='Positioning'
        id='positioning'
        Data={tailwindClasses.alignmentPositioning.positioning}
      ></HeaderDocsTop>

      <ClassToRenderer list={position}></ClassToRenderer>
      <ClassToRenderer list={positionLaterals}></ClassToRenderer>
    </div>
  );
}
