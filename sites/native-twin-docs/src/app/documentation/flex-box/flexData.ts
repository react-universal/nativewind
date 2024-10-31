export const dataFlex = [
  {
    title: 'Flex',
    text: 'Use flex-initial to allow a flex item to shrink but not grow, taking into account its initial size:',
    code: `<div class="flex">
  <div class="flex-none w-14 ...">
    01
  </div>
  <div class="flex-initial w-64 ...">
    02
  </div>
  <div class="flex-initial w-32 ...">
    03
  </div>
</div>`,
  },
  {
    title: 'Flex-1',
    text: 'Use flex-1 to allow a flex item to grow and shrink as needed, ignoring its initial size:',
    code: `<div className="flex">
  <div className="flex-none w-14 ...">
    01
  </div>
  <div className="flex-1 w-64 ...">
    02
  </div>
  <div className="flex-1 w-32 ...">
    03
  </div>
</div>`,
  },
  {
    title: 'Flex-{cols}',
    text: 'Use flex-1 to allow a flex item to grow and shrink as needed, ignoring its initial size:',
    code: `<div className="flex">
  <div className="flex-none w-14 ...">
    01
  </div>
  <div className="flex-1 w-64 ...">
    02
  </div>
  <div className="flex-1 w-32 ...">
    03
  </div>
</div>`,
  },
  {
    title: 'flex-{direction}',
    text: 'Use flex-row to position flex items horizontally in the same direction as text:',
    code: `<div className="flex flex-row ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: '',
    text: 'Use flex-row-reverse to position flex items horizontally in the opposite direction:',
    code: `<div className="flex flex-row-reverse ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: '',
    text: 'Use flex-col to position flex items vertically:',
    code: `<div className="flex flex-col ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: '',
    text: 'Use flex-col-reverse to position flex items vertically in the opposite direction:',
    code: `<div className="flex flex-col-reverse ...">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Flex-wrap',
    text: 'Use flex-wrap to allow flex items to wrap:',
    code: `<div className="flex flex-wrap">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Flex-nowrap',
    text: 'Use flex-nowrap to prevent flex items from wrapping, causing inflexible items to overflow the container if necessary:',
    code: `<div className="flex flex-nowrap">
  <div>01</div>
  <div>02</div>
  <div>03</div>
</div>`,
  },
  {
    title: 'Flex Grow',
    text: 'Use grow to allow a flex item to grow to fill any available space:',
    code: `<div className="flex ...">
  <div className="flex-none w-14 h-14 ...">
    01
  </div>
  <div className="grow h-14 ...">
    02
  </div>
  <div className="flex-none w-14 h-14 ...">
    03
  </div>
</div>`,
  },
  {
    title: '',
    text: 'Use grow-0 to prevent a flex item from growing:',
    code: `<div className="flex ...">
  <div className="grow h-14 ...">
    01
  </div>
  <div className="grow-0 h-14 ...">
    02
  </div>
  <div className="grow h-14 ...">
    03
  </div>
</div>`,
  },
  {
    title: 'Setting the flex basis',
    text: 'Use the basis-* utilities to set the initial size of flex items.',
    code: `<div className="flex flex-row">
  <div className="basis-1/4">01</div>
  <div className="basis-1/4">02</div>
  <div className="basis-1/2">03</div>
</div>`,
  },
];
