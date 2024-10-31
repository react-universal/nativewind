export interface TailwindClass {
  class: string;
  web: boolean;
  native: boolean;
}

export interface TailwindClasses {
  alignmentPositioning: {
    align: TailwindClass[];
    position: TailwindClass[];
    positioning: TailwindClass[];
  };
  textTypography: {
    text: TailwindClass[];
    font: TailwindClass[];
  };
  colorsBackground: {
    background: TailwindClass[];
    border: TailwindClass[];
    textColor: TailwindClass[];
    shadow: TailwindClass[];
    zIndex: TailwindClass[];
  };
  spacing: {
    padding: TailwindClass[];
    margin: TailwindClass[];
    gap: TailwindClass[];
  };
  flexbox: {
    flex: TailwindClass[];
  };
  sizeDimensions: {
    width: TailwindClass[];
    height: TailwindClass[];
    resize: TailwindClass[];
  };
  transformations: {
    translate: TailwindClass[];
    rotate: TailwindClass[];
    skew: TailwindClass[];
    scale: TailwindClass[];
  };
  others: {
    hidden: TailwindClass[];
    overflow: TailwindClass[];
    objectFit: TailwindClass[];
    opacity: TailwindClass[];
    aspectRatio: TailwindClass[];
  };
}

export interface ClassRenderer {
  title: string;
  code: string;
  text: string;
}
