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
          <button onClick={() => navigate(-1)} className="text-gray-600 text-lg">
            ‹
          </button>
        )}
      </div>
      <h1 className="text-base font-medium text-gray-800">{title}</h1>
      <div className="w-16 flex justify-end items-center">{right}</div>
    </header>
  );
}
