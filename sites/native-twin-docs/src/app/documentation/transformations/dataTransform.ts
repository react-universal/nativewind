import { classRenderer } from '@/feactures/documentation/layout/ClassToRederer';

export const dataTransform: classRenderer[] = [
  {
    title: 'Translate',
    text: 'Utilities for translating elements with transform. Use the translate-x-* and translate-y-* utilities to translate an element.',
    code: `<img class="translate-y-6 ...">
<img class="-translate-y-6 ...">
<img class="translate-x-6 ...">
`,
  },
  {
    title: 'Rotate',
    text: 'Utilities for rotating elements with transform. Use the rotate-* utilities to rotate an element.',
    code: `<img class="rotate-0 ...">
<img class="rotate-45 ...">
<img class="rotate-90 ...">
<img class="rotate-180 ...">
`,
  },
  {
    title: 'Skew',
    text: 'Utilities for skewing elements with transform. Use the skew-x-* and skew-y-* utilities to skew an element.',
    code: `<img class="skew-y-0 ...">
<img class="skew-y-3 ...">
<img class="skew-y-6 ...">
<img class="skew-y-12 ...">
`,
  },
  {
    title: 'Scale',
    text: 'Utilities for scaling elements with transform. Use the scale-*, scale-x-*, and scale-y-* utilities to scale an element. ',
    code: `<img class="scale-75 ...">
<img class="scale-100 ...">
<img class="scale-125 ...">
`,
  },
];
