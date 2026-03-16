import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Overlay({ children }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      {children}
    </div>
  );
}
