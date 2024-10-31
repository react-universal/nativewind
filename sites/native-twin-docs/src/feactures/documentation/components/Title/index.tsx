export const Title = ({ children, id }: { children: string; id?: string }) => {
  return (
    <h2 style={{ color: ' #26C6DA' }} id={id} className='text-[36px] font-bold'>
      {children}
    </h2>
  );
};
