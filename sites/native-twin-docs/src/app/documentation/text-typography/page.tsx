import { ClassToRenderer } from '@/feactures/documentation/layout/ClassToRederer';
import { HeaderDocsTop } from '@/feactures/documentation/layout/HeaderDocsTop';
import tailwindClasses from '../../../../data';
import { dataDecoration, dataText } from './dataText';

export default function TextTypographyPage() {
  return (
    <div className='flex flex-col gap-10'>
      <HeaderDocsTop
        title='Text Styles'
        id='textStyles'
        Data={tailwindClasses.textTypography.textStyles}
      ></HeaderDocsTop>
      <ClassToRenderer list={dataText} />
      <HeaderDocsTop
        title='Decoration And Color'
        id='decorationAndColor'
        Data={tailwindClasses.textTypography.decorationAndColor}
      ></HeaderDocsTop>
      <ClassToRenderer list={dataDecoration} />
    </div>
  );
}
