import type { ReactNode } from 'react';
import TabBar from './TabBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-surface text-text-primary">
      <main className="max-w-lg mx-auto pb-20">{children}</main>
      <TabBar />
    </div>
  );
}
