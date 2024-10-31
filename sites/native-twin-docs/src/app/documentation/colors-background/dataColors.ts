import { classRenderer } from '@/feactures/documentation/layout/ClassToRederer';

export const dataBackground: classRenderer[] = [
  {
    title: 'Background Color',
    text: "Utilities for controlling an element's background color.",
    code: `<button class="bg-sky-500/100 ..."></button>
<button class="bg-sky-500/75 ..."></button>
<button class="bg-sky-500/50 ..."></button>
`,
  },
  {
    title: 'Border Radius',
    text: 'Utilities for controlling the border radius of an element.',
    code: `<div class="rounded ..."></div>
<div class="rounded-md ..."></div>
<div class="rounded-lg ..."></div>
<div class="rounded-full ..."></div>
`,
  },
  {
    title: 'Border Width',
    text: "Utilities for controlling the width of an element's borders.",
    code: `<div class="border border-sky-500"></div>
<div class="border-2 border-sky-500"></div>
<div class="border-4 border-sky-500"></div>
<div class="border-8 border-sky-500"></div>
`,
  },
  {
    title: 'Border Color',
    text: "Utilities for controlling the color of an element's borders.",
    code: `<div class="border-4 border-indigo-500/100 ..."></div>
<div class="border-4 border-indigo-500/75 ..."></div>
<div class="border-4 border-indigo-500/50 ..."></div>
`,
  },
  {
    title: '',
    text: '',
    code: `
`,
  },
];

export const dataShadowAndIndex: classRenderer[] = [
  {
    title: 'Box Shadow Color',
    text: 'Use the shadow-* utilities to change the color of an existing box shadow. By default colored shadows have an opacity of 100%, but you can adjust this using the opacity modifier.',
    code: `<button class="bg-cyan-500 shadow-lg shadow-cyan-500/50 ...">Subscribe</button>
<button class="bg-blue-500 shadow-lg shadow-blue-500/50 ...">Subscribe</button>
<button class="bg-indigo-500 shadow-lg shadow-indigo-500/50 ...">Subscribe</button>
`,
  },
  {
    title: 'Z-Index',
    text: 'Utilities for controlling the stack order of an element. Use the z-* utilities to control the stack order (or three-dimensional positioning) of an element, regardless of order it has been displayed.',
    code: `<div class="z-40 ...">05</div>
<div class="z-30 ...">04</div>
<div class="z-20 ...">03</div>
<div class="z-10 ...">02</div>
<div class="z-0 ...">01</div>
`,
  },
];
