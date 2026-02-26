// ========================================
// 앱 레이아웃 - 상단 영역 + 콘텐츠 + 하단 탭바
// ========================================

import type { ReactNode } from 'react';
import TabBar from './TabBar';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* 스크롤 가능한 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto px-5 pt-6 pb-24">
        {children}
      </main>
      {/* 고정 하단 탭바 */}
      <TabBar />
    </div>
  );
}
