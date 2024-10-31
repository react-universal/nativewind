import { classRenderer } from '@/feactures/documentation/layout/ClassToRederer';

export const alignmentData = [
  {
    title: 'Align-baseline',
    text: "Use items-baseline to align items along the container's cross axis such that all of their baselines align: 01",
    code: `<div class="flex items-baseline ...">
  <div class="pt-2 pb-6">01</div>
  <div class="pt-8 pb-12">02</div>
  <div class="pt-12 pb-4">03</div>
</div>`,
  },
  {
    title: 'Align-top',
    text: 'Use align-top to align the top of an element and its descendants with the top of the entire line.',
    code: `<span class="inline-block align-top ...">...</span>`,
  },
  {
    title: 'Align middle',
    text: 'Use align-middle to align the middle of an element with the baseline plus half the x-height of the parent.',
    code: `<span class="inline-block align-middle ...">...</span>`,
  },
  {
    title: 'Align bottom',
    text: 'Use align-bottom to align the bottom of an element and its descendants with the bottom of the entire line.',
    code: `<span class="inline-block align-bottom ...">...</span>`,
  },
  {
    title: 'Align text top',
    text: "Use align-text-top to align the top of an element with the top of the parent element's font.",
    code: `<span class="inline-block align-text-top ...">...</span>`,
  },
  {
    title: 'Align text bottom',
    text: "Use align-text-bottom to align the bottom of an element with the bottom of the parent element's font.",
    code: `<span class="inline-block align-text-bottom ...">...</span>`,
  },
  {
    title: 'Justify Content (justify-{alignment})',
    text: "Utilities for controlling how flex and grid items are positioned along a container's main axis.",
    code: '',
  },
  {
    title: 'Start',
    text: "Use justify-start to justify items against the start of the container's main axis:",
    code: `<div class="flex justify-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Center',
    text: "Use justify-center to justify items along the center of the container's main axis:",
    code: `<div class="flex justify-center ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'End',
    text: "Use justify-end to justify items against the end of the container's main axis:",
    code: `<div class="flex justify-end ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Space between',
    text: "Use justify-between to justify items along the container's main axis such that there is an equal amount of space between each item:",
    code: `<div class="flex justify-between ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Space around',
    text: "Use justify-around to justify items along the container's main axis such that there is an equal amount of space on each side of each item:",
    code: `<div class="flex justify-around ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Space evenly',
    text: "Use justify-evenly to justify items along the container's main axis such that there is an equal amount of space around each item, but also accounting for the doubling of space you would normally see between each item when using justify-around:",
    code: `<div class="flex justify-evenly ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Stretch',
    text: "Use justify-stretch to allow content items to fill the available space along the container's main axis:",
    code: `<div class="grid grid-flow-col justify-stretch ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
];

export const justifyItems: classRenderer[] = [
  {
    title: 'Start',
    text: 'Use justify-items-start to justify grid items against the start of their inline axis:',
    code: `<div class="grid justify-items-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>`,
  },
  {
    title: 'End',
    text: 'Use justify-items-end to justify grid items against the end of their inline axis:',
    code: `<div class="grid justify-items-end ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>`,
  },
  {
    title: 'Center',
    text: 'Use justify-items-center to justify grid items along their inline axis:',
    code: `<div class="grid justify-items-center ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>`,
  },
  {
    title: 'Stretch',
    text: 'Use justify-items-stretch to stretch items along their inline axis:',
    code: `<div class="grid justify-items-stretch ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
  <div>06</div>
</div>`,
  },
];
export const justifySelf: classRenderer[] = [
  {
    title: 'Auto',
    text: 'Use justify-self-auto to align an item based on the value of the grid’s justify-items property:',
    code: `<div class="grid justify-items-stretch ...">
  <!-- ... -->
  <div class="justify-self-auto ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>`,
  },
  {
    title: 'Start',
    text: 'Use justify-self-start to align a grid item to the start of its inline axis:',
    code: `<div class="grid justify-items-stretch ...">
  <!-- ... -->
  <div class="justify-self-start ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>`,
  },
  {
    title: 'Center',
    text: 'Use justify-self-center to align a grid item along the center of its inline axis:',
    code: `<div class="grid justify-items-stretch ...">
  <!-- ... -->
  <div class="justify-self-center ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>`,
  },
  {
    title: 'End',
    text: 'Use justify-self-end to align a grid item to the end of its inline axis:',
    code: `<div class="grid justify-items-stretch ...">
  <!-- ... -->
  <div class="justify-self-end ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>`,
  },
  {
    title: 'Stretch',
    text: 'Use justify-self-stretch to stretch a grid item to fill the grid area on its inline axis:',
    code: `<div class="grid justify-items-start ...">
  <!-- ... -->
  <div class="justify-self-stretch ...">02</div>
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
  <!-- ... -->
</div>`,
  },
];

export const alignItems: classRenderer[] = [
  {
    title: 'Stretch',
    text: 'Use items-stretch to stretch items to fill the container’s cross axis:',
    code: `<div class="flex items-stretch ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>`,
  },
  {
    title: 'Start',
    text: 'Use items-start to align items to the start of the container’s cross axis:',
    code: `<div class="flex items-start ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>`,
  },
  {
    title: 'Center',
    text: 'Use items-center to align items along the center of the container’s cross axis:',
    code: `<div class="flex items-center ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>`,
  },
  {
    title: 'End',
    text: 'Use items-end to align items to the end of the container’s cross axis:',
    code: `<div class="flex items-end ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>`,
  },
  {
    title: 'Baseline',
    text: 'Use items-baseline to align items along the container’s cross axis such that all of their baselines align:',
    code: `<div class="flex items-baseline ...">
  <div class="pt-2 pb-6">01</div>
  <div class="pt-8 pb-12">02</div>
  <div class="pt-12 pb-4">03</div>
</div>`,
  },
];
export const alignSelf: classRenderer[] = [
  {
    title: 'Auto',
    text: 'Use self-auto to align an item based on the value of the container’s align-items property:',
    code: `<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-auto ...">02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Start',
    text: 'Use self-start to align an item to the start of the container’s cross axis, despite the container’s align-items value:',
    code: `<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-start ...">02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Center',
    text: 'Use self-center to align an item along the center of the container’s cross axis, despite the container’s align-items value:',
    code: `<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-center ...">02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'End',
    text: 'Use self-end to align an item to the end of the container’s cross axis, despite the container’s align-items value:',
    code: `<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-end ...">02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Stretch',
    text: 'Use self-stretch to stretch an item to fill the container’s cross axis, despite the container’s align-items value:',
    code: `<div class="flex items-stretch ...">
  <div>01</div>
  <div class="self-stretch ...">02</div>
  <div>03</div>
</div>`,
  },
];

export const alignContent: classRenderer[] = [
  {
    title: 'Start',
    text: 'Use content-start to pack rows in a container against the start of the cross axis:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-start ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Center',
    text: 'Use content-center to pack rows in a container in the center of the cross axis:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-center ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>
`,
  },
  {
    title: 'End',
    text: 'Use content-end to pack rows in a container against the end of the cross axis:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-end ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Space between',
    text: 'Use content-between to distribute rows in a container such that there is an equal amount of space between each line:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-between ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Space around',
    text: 'Use content-around to distribute rows in a container such that there is an equal amount of space around each line:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-around ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Space evenly',
    text: 'Use content-evenly to distribute rows in a container such that there is an equal amount of space around each item, but also accounting for the doubling of space you would normally see between each item when using content-around:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-evenly ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Stretch',
    text: 'Use content-stretch to allow content items to fill the available space along the container’s cross axis:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-stretch ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
  {
    title: 'Normal',
    text: 'Use content-normal to pack content items in their default position as if no align-content value was set:',
    code: `<div class="h-56 grid grid-cols-3 gap-4 content-normal ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
  <div>04</div>
  <div>05</div>
</div>`,
  },
];

export const position: classRenderer[] = [
  {
    title: 'Statically positioning elements',
    text: `Use the static utility to position an element according to the normal flow of the document.

Any offsets will be ignored and the element will not act as a position reference for absolutely positioned children.`,
    code: `<div class="static ...">
  <p>Static parent</p>
  <div class="absolute bottom-0 left-0 ...">
    <p>Absolute child</p>
  </div>
</div>`,
  },
  {
    title: 'Relatively positioning elements',
    text: `Use the relative utility to position an element according to the normal flow of the document.

Any offsets are calculated relative to the element’s normal position and the element will act as a position reference for absolutely positioned children.

`,
    code: `<div class="relative ...">
  <p>Relative parent</p>
  <div class="absolute bottom-0 left-0 ...">
    <p>Absolute child</p>
  </div>
</div>`,
  },
  {
    title: 'Absolutely positioning elements',
    text: `Use the absolute utility to position an element outside of the normal flow of the document, causing neighboring elements to act as if the element doesn’t exist.

Any offsets are calculated relative to the nearest parent that has a position other than static, and the element will act as a position reference for other absolutely positioned children.`,
    code: `<div class="static ...">
  <!-- Static parent -->
  <div class="static ..."><p>Static child</p></div>
  <div class="inline-block ..."><p>Static sibling</p></div>
  <!-- Static parent -->
  <div class="absolute ..."><p>Absolute child</p></div>
  <div class="inline-block ..."><p>Static sibling</p></div>
</div>`,
  },
  {
    title: 'Fixed positioning elements',
    text: `Use the fixed utility to position an element relative to the browser window.

Any offsets are calculated relative to the viewport and the element will act as a position reference for absolutely positioned children.`,
    code: `<div class="relative">
  <div class="fixed top-0 left-0 right-0">Contacts</div>
  <div>
    <div>
      <img src="..." />
      <strong>Andrew Alfred</strong>
    </div>
    <div>
      <img src="..." />
      <strong>Debra Houston</strong>
    </div>
    <!-- ... -->
  </div>
</div>`,
  },
  {
    title: 'Sticky positioning elements',
    text: `Use the sticky utility to position an element as relative until it crosses a specified threshold, then treat it as fixed until its parent is off screen.

Any offsets are calculated relative to the element’s normal position and the element will act as a position reference for absolutely positioned children.`,
    code: `<div>
  <div>
    <div class="sticky top-0 ...">A</div>
    <div>
      <div>
        <img src="..." />
        <strong>Andrew Alfred</strong>
      </div>
      <div>
        <img src="..." />
        <strong>Aisha Houston</strong>
      </div>
      <!-- ... -->
    </div>
  </div>
  <div>
    <div class="sticky top-0">B</div>
    <div>
      <div>
        <img src="..." />
        <strong>Bob Alfred</strong>
      </div>
      <!-- ... -->
    </div>
  </div>
  <!-- ... -->
</div>`,
  },
];

export const positionLaterals: classRenderer[] = [
  {
    title: 'Placing a positioned element',
    text: `Use the top-*, right-*, bottom-*, left-*, and inset-* utilities to set the horizontal or vertical position of a positioned element.`,
    code: `<!-- Pin to top left corner -->
<div class="relative h-32 w-32 ...">
  <div class="absolute left-0 top-0 h-16 w-16 ...">01</div>
</div>

<!-- Span top edge -->
<div class="relative h-32 w-32 ...">
  <div class="absolute inset-x-0 top-0 h-16 ...">02</div>
</div>

<!-- Pin to top right corner -->
<div class="relative h-32 w-32 ...">
  <div class="absolute top-0 right-0 h-16 w-16 ...">03</div>
</div>

<!-- Span left edge -->
<div class="relative h-32 w-32 ...">
  <div class="absolute inset-y-0 left-0 w-16 ...">04</div>
</div>

<!-- Fill entire parent -->
<div class="relative h-32 w-32 ...">
  <div class="absolute inset-0 ...">05</div>
</div>

<!-- Span right edge -->
<div class="relative h-32 w-32 ...">
  <div class="absolute inset-y-0 right-0 w-16 ...">06</div>
</div>

<!-- Pin to bottom left corner -->
<div class="relative h-32 w-32 ...">
  <div class="absolute bottom-0 left-0 h-16 w-16 ...">07</div>
</div>

<!-- Span bottom edge -->
<div class="relative h-32 w-32 ...">
  <div class="absolute inset-x-0 bottom-0 h-16 ...">08</div>
</div>

<!-- Pin to bottom right corner -->
<div class="relative h-32 w-32 ...">
  <div class="absolute bottom-0 right-0 h-16 w-16 ...">09</div>
</div>`,
  },
  {
    title: 'Using negative values',
    text: `To use a negative top/right/bottom/left value, prefix the class name with a dash to convert it to a negative value.

`,
    code: `<div class="relative h-32 w-32 ...">
  <div class="absolute h-14 w-14 -left-4 -top-4 ..."></div>
</div>`,
  },
  {
    title: 'Using logical properties',
    text: `Use the start-* and end-* utilities to set the inset-inline-start and inset-inline-end logical properties, which map to either the left or right side based on the text direction.

`,
    code: `<div dir="ltr">
  <div class="relative h-32 w-32 ...">
    <div class="absolute h-14 w-14 top-0 start-0 ..."></div>
  </div>
<div>

<div dir="rtl">
  <div class="relative h-32 w-32 ...">
    <div class="absolute h-14 w-14 top-0 start-0 ..."></div>
  </div>
<div>`,
  },
];
