import { ClassRenderer } from '../../../../Interface/tailwindClass';

export const paddingData: ClassRenderer[] = [
  {
    title: 'Add padding to a single side',
    text: 'Use the pt-*, pr-*, pb-*, and pl-* utilities to control the padding on one side of an element.For example, pt-6 would add 1.5rem of padding to the top of an element, pr-4 would add 1rem of padding to the right of an element, pb-8 would add 2rem of padding to the bottom of an element, and pl-2 would add 0.5rem of padding to the left of an element.',
    code: `<div class="pt-6 ...">pt-6</div>
<div class="pr-4 ...">pr-4</div>
<div class="pb-8 ...">pb-8</div>
<div class="pl-2 ...">pl-2</div>`,
  },
  {
    title: 'Add horizontal padding',
    text: 'Use the px-* utilities to control the horizontal padding of an element.',
    code: `<div class="px-8 ...">px-8</div>`,
  },
  {
    title: 'Add vertical padding',
    text: 'Use the py-* utilities to control the vertical padding of an element.',
    code: `<div class="py-8 ...">py-8</div>`,
  },
  {
    title: 'Add padding to all sides',
    text: 'Use the p-* utilities to control the padding on all sides of an element.',
    code: `<div class="p-8 ...">p-8</div>`,
  },
  {
    title: 'Using logical properties',
    text: 'Use the ps-* and pe-* utilities to set the padding-inline-start and padding-inline-end logical properties, which map to either the left or right side based on the text direction.',
    code: `<div dir="ltr">
  <div class="ps-8 ...">ps-8</div>
  <div class="pe-8 ...">pe-8</div>
<div>

<div dir="rtl">
  <div class="ps-8 ...">ps-8</div>
  <div class="pe-8 ...">pe-8</div>
<div>`,
  },
  {
    title: 'Add margin to a single side',
    text: `Use the mt-*, mr-*, mb-*, and ml-* utilities to control the margin on one side of an element.

For example, mt-6 would add 1.5rem of margin to the top of an element, mr-4 would add 1rem of margin to the right of an element, mb-8 would add 2rem of margin to the bottom of an element, and ml-2 would add 0.5rem of margin to the left of an element.`,
    code: `<div class="mt-6 ...">mt-6</div>
<div class="mr-4 ...">mr-4</div>
<div class="mb-8 ...">mb-8</div>
<div class="ml-2 ...">ml-2</div>`,
  },
  {
    title: 'Add horizontal margin',
    text: `Use the mx-* utilities to control the horizontal margin of an element.`,
    code: `<div class="mx-8 ...">mx-8</div>`,
  },
  {
    title: 'Add vertical margin',
    text: 'Use the my-* utilities to control the vertical margin of an element.',
    code: `<div class="my-8 ...">my-8</div>`,
  },
  {
    title: 'Add margin to all sides',
    text: 'Use the m-* utilities to control the margin on all sides of an element.',
    code: `<div class="m-8 ...">m-8</div>`,
  },
  {
    title: 'Using negative values',
    text: 'To use a negative margin value, prefix the class name with a dash to convert it to a negative value.',
    code: `<div class="w-36 h-16 bg-sky-400 opacity-20 ..."></div>
<div class="-mt-8 bg-sky-300 ...">-mt-8</div>`,
  },
  {
    title: 'Using logical properties',
    text: 'Use the ms-* and me-* utilities to set the margin-inline-start and margin-inline-end logical properties, which map to either the left or right side based on the text direction.',
    code: `<div dir="ltr">
  <div class="ms-8 ...">ms-8</div>
  <div class="me-8 ...">me-8</div>
<div>

<div dir="rtl">
  <div class="ms-8 ...">ms-8</div>
  <div class="me-8 ...">me-8</div>
<div>`,
  },
];

export const gapData: ClassRenderer[] = [
  {
    title: 'Setting the gap between elements',
    text: 'Use the gap-* utilities to change the gap between both rows and columns in grid and flexbox layouts.',
    code: `<div class="grid gap-4 grid-cols-2">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
</div>`,
  },
  {
    title: 'Changing row and column gaps independently',
    text: 'Use the gap-x-* and gap-y-* utilities to change the gap between columns and rows independently.',
    code: `<div class="grid gap-x-8 gap-y-4 grid-cols-3">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>`,
  },
];
