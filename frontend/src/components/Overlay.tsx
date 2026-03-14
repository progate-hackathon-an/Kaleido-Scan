import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Overlay({ children }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
}
