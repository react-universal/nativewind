import { normalText } from '@/constants/colors';

export const Text = ({ children, color }: { children: any; color?: string }) => {
  return (
    <p style={{ color: color ? color : normalText }} className='text-base '>
      {children}
    </p>
  );
};
