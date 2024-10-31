'use client';

import { ChangeEvent, useState } from 'react';
import {
  searchTailwindClasses,
  TailwindClassResult,
} from '@/Utils/searchTailwindClasses';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export const SearchButton = () => {
  const router = useRouter();
  const [list, setList] = useState<TailwindClassResult[]>([]);

  const handlerChangeSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const searchResults = searchTailwindClasses(event.target.value);
    searchResults.length = 4;
    setList(searchResults);
  };

  const handlerGoUrl = (search: string) => () => router.push('/documentation/' + search);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className=' text-[24px] min-h-[54px] text-center w-full flex items-center  py-1 rounded-lg bg-[#1F2937] cursor-pointer '
          variant='outline'
        >
          Quick search...
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Search Class</DialogTitle>
          <input onChange={handlerChangeSearch} className='p-2' type='text' />
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          {list.map((item, index) => {
            return (
              <button
                onClick={handlerGoUrl(item.route)}
                className='bg-[#1a1a0a] p-2 text-start'
                key={index + item.class}
              >
                {item.class}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
