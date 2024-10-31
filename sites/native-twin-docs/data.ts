export interface TailwindClass {
  class: string;
  web: boolean;
  native: boolean;
}
export const TAILWIND_CLASSES = {
  flexbox: {
    flexProperties: [
      { class: 'flex', web: true, native: true },
      { class: 'flex-1', web: true, native: true },
      { class: 'flex-{cols}', web: true, native: true },
      { class: 'flex-{direction}', web: true, native: true },
      { class: 'flex-wrap', web: true, native: true },
      { class: 'flex-nowrap', web: true, native: true },
      { class: 'grow-{factor}', web: true, native: true },
      { class: 'basis-{size}', web: true, native: true },
    ],
  },
  alignmentPositioning: {
    alignment: [
      { class: 'align-baseline', web: true, native: true },
      { class: 'align-top', web: true, native: true },
      { class: 'align-middle', web: true, native: true },
      { class: 'align-bottom', web: true, native: true },
      { class: 'align-text-top', web: true, native: true },
      { class: 'align-text-bottom', web: true, native: true },
      { class: 'justify-{alignment}', web: true, native: true },
      { class: 'items-{alignment}', web: true, native: true },
      { class: 'self-{alignment}', web: true, native: true },
      { class: 'content-{alignment}', web: true, native: true },
    ],
    positioning: [
      { class: 'static', web: true, native: true },
      { class: 'fixed', web: true, native: true },

      { class: 'absolute', web: true, native: true },

      { class: 'relative', web: true, native: true },
      { class: 'sticky', web: true, native: true },

      { class: 'top-{size}', web: true, native: true },
      { class: 'left-{size}', web: true, native: true },
      { class: 'bottom-{size}', web: true, native: true },
      { class: 'right-{size}', web: true, native: true },
    ],
  },

  spacing: {
    paddingMargin: [
      { class: 'p-{size}', web: true, native: true },
      { class: 'px-{size}', web: true, native: true },
      { class: 'py-{size}', web: true, native: true },
      { class: 'm-{size}', web: true, native: true },
      { class: 'mx-{size}', web: true, native: true },
      { class: 'my-{size}', web: true, native: true },
    ],
    gap: [{ class: 'gap-{size}', web: true, native: true }],
  },
  sizeDimensions: {
    dimensions: [
      { class: 'w-{size}', web: true, native: true },
      { class: 'max-w-{size}', web: true, native: true },
      { class: 'min-w-{size}', web: true, native: true },
      { class: 'h-{size}', web: true, native: true },
      { class: 'max-h-{size}', web: true, native: true },
      { class: 'min-h-{size}', web: true, native: true },
    ],
    resize: [
      { class: 'resize', web: true, native: true },
      { class: 'resize-x', web: true, native: true },
      { class: 'resize-y', web: true, native: true },
      { class: 'resize-none', web: true, native: true },
    ],
  },
  textTypography: {
    textStyles: [
      { class: 'text-{size}', web: true, native: true },
      { class: 'text-left', web: true, native: true },
      { class: 'text-center', web: true, native: true },
      { class: 'text-right', web: true, native: true },
      { class: 'text-justify', web: true, native: true },
      { class: 'font-{weight}', web: true, native: true },
      { class: 'capitalize', web: true, native: true },
      { class: 'uppercase', web: true, native: true },
      { class: 'lowercase', web: true, native: true },
      { class: 'italic', web: true, native: true },
      { class: 'not-italic', web: true, native: true },
      { class: 'leading-{size}', web: true, native: true },
    ],
    decorationAndColor: [
      { class: 'decoration-{style}', web: true, native: true },
      { class: 'decoration-{color}', web: true, native: true },
      { class: 'text-{color}', web: true, native: true },
    ],
  },
  colorsBackground: {
    background: [
      { class: 'bg-{color}', web: true, native: true },
      { class: 'border-{size}', web: true, native: true },
      { class: 'border-{color}', web: true, native: true },
    ],
    shadowZIndex: [
      { class: 'shadow-{size}', web: true, native: true },
      { class: 'z-{index}', web: true, native: true },
    ],
  },
  transformations: {
    transform: [
      { class: 'translate-{axis}-{value}', web: true, native: true },
      { class: 'rotate-{degrees}', web: true, native: true },
      { class: 'skew-{axis}-{value}', web: true, native: true },
      { class: 'scale-{value}', web: true, native: true },
    ],
  },
  others: {
    visibility: [
      { class: 'hidden', web: true, native: true },
      { class: 'overflow-{behavior}', web: true, native: true },
    ],
    objectProperties: [
      { class: 'object-{fit}', web: true, native: true },
      { class: 'opacity-{value}', web: true, native: true },
      { class: 'aspect-{ratio}', web: true, native: true },
    ],
  },
};
export const TAILWIND_GLOSSARY = {
  setUp: {
    title: 'SetUp',
    categories: [
      { name: 'Expo App', route: 'setup/expo-app' },
      { name: 'Expo Route', route: 'setup/expo-router' },
      { name: 'Next App', route: 'setup/next-app' },
      { name: 'Next App Dir', route: 'setup/next-app-dir' },
    ],
  },
  flexbox: {
    title: 'Flexbox',
    categories: [{ name: 'Flex Properties', route: 'flex-box/#flexProperties' }],
  },
  alignmentPositioning: {
    title: 'Alignment & Positioning',
    categories: [
      { name: 'Alignment Classes', route: 'alignment-position/#alignment' },
      { name: 'Positioning Classes', route: 'alignment-position/#positioning' },
    ],
  },

  spacing: {
    title: 'Spacing',
    categories: [
      { name: 'Padding and Margin', route: 'spacing/#paddingMargin' },
      { name: 'Gap Classes', route: 'spacing/#gap' },
    ],
  },
  sizeDimensions: {
    title: 'Size & Dimensions',
    categories: [
      { name: 'Width and Height', route: 'size-dimensions/#dimensions' },
      { name: 'Resize Classes', route: 'size-dimensions/#resize' },
    ],
  },
  textTypography: {
    title: 'Text & Typography',
    categories: [
      { name: 'Text Styles', route: 'text-typography/#textStyles' },
      {
        name: 'Text Decoration and Colors',
        route: 'text-typography/#decorationAndColor',
      },
    ],
  },
  colorsBackground: {
    title: 'Colors & Background',
    categories: [
      {
        name: 'Background and Borders',
        route: 'colors-background/#background',
      },
      { name: 'Shadows and Z-Index', route: 'colors-background/#shadowZIndex' },
    ],
  },
  transformations: {
    title: 'Transformations',
    categories: [{ name: 'Transform Functions', route: 'transformations/#transform' }],
  },
  others: {
    title: 'Others',
    categories: [
      { name: 'Visibility and Overflow', route: 'other/#visibility' },
      { name: 'Object Fit and Properties', route: 'other/#objectProperties' },
    ],
  },
};

export default TAILWIND_CLASSES;
