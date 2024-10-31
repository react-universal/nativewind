import { classRenderer } from '@/feactures/documentation/layout/ClassToRederer';

export const dataSize: classRenderer[] = [
  {
    title: 'Width',
    text: 'Use utilities like w-px, w-1, and w-64 to set an element to a fixed width.',
    code: `<div class="w-96 ...">w-96</div>
<div class="w-80 ...">w-80</div>
<div class="w-64 ...">w-64</div>
<div class="w-48 ...">w-48</div>
<div class="w-40 ...">w-40</div>
<div class="w-32 ...">w-32</div>
<div class="w-24 ...">w-24</div>`,
  },
  {
    title: 'Max-Width',
    text: 'Utilities for setting the maximum width of an element. Set the maximum width of an element using the max-w-* utilities.',
    code: `<div>
  <div class="w-full max-w-96 ...">max-w-96</div>
  <div class="w-full max-w-80 ...">max-w-80</div>
  <div class="w-full max-w-64 ...">max-w-64</div>
  <div class="w-full max-w-48 ...">max-w-48</div>
  <div class="w-full max-w-40 ...">max-w-40</div>
  <div class="w-full max-w-32 ...">max-w-32</div>
  <div class="w-full max-w-24 ...">max-w-24</div>
</div>`,
  },
  {
    title: 'Min-Width',
    text: 'Utilities for setting the minimum width of an element.Set the minimum width of an element using min-w-* utilities.',
    code: `<div class="w-96 ...">
  <div class="min-w-80 ...">min-w-80</div>
  <div class="min-w-64 ...">min-w-64</div>
  <div class="min-w-48 ...">min-w-48</div>
  <div class="min-w-40 ...">min-w-40</div>
  <div class="min-w-32 ...">min-w-32</div>
  <div class="min-w-24 ...">min-w-24</div>
  <div class="min-w-full ...">min-w-full</div>
</div>`,
  },
  {
    title: 'Height',
    text: 'Utilities for setting the height of an element. Use utilities like h-px, h-1, and h-64 to set an element to a fixed height.',
    code: `<div class="h-96 ...">h-96</div>
<div class="h-80 ...">h-80</div>
<div class="h-64 ...">h-64</div>
<div class="h-48 ...">h-48</div>
<div class="h-40 ...">h-40</div>
<div class="h-32 ...">h-32</div>
<div class="h-24 ...">h-24</div>`,
  },
  {
    title: 'Max-Height',
    text: 'Utilities for setting the maximum height of an element. Set the maximum height of an element using max-h-* utilities.',
    code: `<div class="h-96 ...">
  <div class="h-full max-h-80 ...">max-h-80</div>
  <div class="h-full max-h-64 ...">max-h-64</div>
  <div class="h-full max-h-48 ...">max-h-48</div>
  <div class="h-full max-h-40 ...">max-h-40</div>
  <div class="h-full max-h-32 ...">max-h-32</div>
  <div class="h-full max-h-24 ...">max-h-24</div>
  <div class="h-full max-h-full ...">max-h-full</div>
</div>`,
  },
  {
    title: 'Min-Height',
    text: 'Utilities for setting the minimum height of an element. Set the minimum height of an element using min-h-* utilities.',
    code: `<div class="h-96 ...">
  <div class="min-h-80 ...">min-h-80</div>
  <div class="min-h-64 ...">min-h-64</div>
  <div class="min-h-48 ...">min-h-48</div>
  <div class="min-h-40 ...">min-h-40</div>
  <div class="min-h-32 ...">min-h-32</div>
  <div class="min-h-24 ...">min-h-24</div>
  <div class="min-h-full ...">min-h-full</div>
</div>
`,
  },
];

export const dataResize: classRenderer[] = [
  {
    title: 'Resize',
    text: 'Utilities for controlling how an element can be resized. Use resize to make an element horizontally and vertically resizable.',
    code: `<textarea class="resize rounded-md"></textarea>
`,
  },
  {
    title: 'Resizing horizontally',
    text: 'Use resize-x to make an element horizontally resizable.',
    code: `<textarea class="resize-x rounded-md"></textarea>
`,
  },
  {
    title: 'Resizing vertically',
    text: 'Use resize-y to make an element vertically resizable.',
    code: `<textarea class="resize-y rounded-md"></textarea>
`,
  },
  {
    title: 'Preventing resizing',
    text: 'Use resize-none to prevent an element from being resizable.',
    code: `<textarea class="resize-none rounded-md"></textarea>
`,
  },
];
