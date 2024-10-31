import { classRenderer } from '@/feactures/documentation/layout/ClassToRederer';

export const dataVisibility: classRenderer[] = [
  {
    title: 'Hidden',
    text: 'Use the hidden utility to set an element to display: none and remove it from the page layout (compare with invisible from the visibility documentation).',
    code: `<div class="flex ...">
  <div class="hidden ...">01</div>
  <div>02</div>
  <div>03</div>
</div>
`,
  },
  {
    title: 'Overflow',
    text: 'Utilities for controlling how an element handles content that is too large for the container. Use the overflow-visible utility to prevent content within an element from being clipped. Note that any content that overflows the bounds of the element will then be visible.',
    code: `<div class="overflow-visible ..."></div> <div class="overflow-hidden ..."></div>
`,
  },
];

export const ObjectProperties: classRenderer[] = [
  {
    title: 'Object Fit',
    text: "Utilities for controlling how a replaced element's content should be resized.  Use the object-cover utility to resize an element’s content to cover its container.",
    code: `<div class="bg-indigo-300 ...">
  <img class="object-cover h-48 w-96 ...">
</div>
`,
  },
  {
    title: 'Opacity',
    text: 'Utilities for controlling the opacity of an element. Use the opacity-* utilities to control the opacity of an element.',
    code: `<button class="bg-indigo-500 opacity-100 ..."></button>
<button class="bg-indigo-500 opacity-75 ..."></button>
<button class="bg-indigo-500 opacity-50 ..."></button>
<button class="bg-indigo-500 opacity-25 ..."></button>
`,
  },
  {
    title: 'Aspect Ratio',
    text: ' Utilities for controlling the aspect ratio of an element. Use the aspect-* utilities to set the desired aspect ratio of an element.',
    code: `<iframe class="w-full aspect-video ..." src="https://www.youtube.com/..."></iframe>

`,
  },
];
