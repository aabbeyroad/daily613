import type { ReactNode } from 'react';
import TabBar from './TabBar';
import { AppShell } from '../ui/primitives';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AppShell>
      <main>{children}</main>
      <TabBar />
    </AppShell>
  );
}
