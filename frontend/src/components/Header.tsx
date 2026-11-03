import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  back?: boolean;
  right?: ReactNode;
}

export default function Header({ title, back = true, right }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-white px-4 h-12 flex items-center justify-between border-b border-gray-100">
      <div className="w-16 flex items-center">
        {back && (
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-8 h-8 -ml-1 text-gray-700 active:text-gray-400">
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 1L1 9L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <h1 className="text-base font-medium text-gray-800">{title}</h1>
      <div className="w-16 flex justify-end items-center">{right}</div>
    </header>
  );
}
