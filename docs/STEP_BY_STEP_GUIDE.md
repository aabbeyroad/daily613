# Daily613 앱스토어 출시 — 단계별 실행 가이드

> 이 문서는 `APP_STORE_RELEASE_PLAN.md`의 실행 버전입니다.
> 각 단계를 순서대로 따라가면 앱스토어 출시까지 완료할 수 있습니다.

---

## Phase 1: 네이티브 앱 전환 (2주)

현재 React PWA를 Capacitor로 감싸서 iOS 네이티브 앱으로 만듭니다.

---

### Step 1-1. 사전 준비 확인

시작 전 다음이 준비되어 있는지 확인하세요:

- [ ] **Mac 컴퓨터** (Xcode 빌드에 필수)
- [ ] **Xcode 최신 버전** 설치 (App Store에서 무료 다운로드)
- [ ] **Xcode Command Line Tools** 설치
  ```bash
  xcode-select --install
  ```
- [ ] **CocoaPods** 설치
  ```bash
  sudo gem install cocoapods
  ```
- [ ] **Node.js 18+** 설치 확인
  ```bash
  node --version
  ```

---

### Step 1-2. Capacitor 설치 및 초기화

```bash
# 1) 프로젝트 루트에서 Capacitor 코어 + CLI 설치
npm install @capacitor/core
npm install -D @capacitor/cli

# 2) 웹 앱을 먼저 빌드 (Capacitor가 dist 폴더를 참조)
npm run build

# 3) Capacitor 초기화
npx cap init "데일리613" "com.daily613.app" --web-dir dist
```

**확인**: 프로젝트 루트에 `capacitor.config.ts` 파일이 생성되었는지 확인하세요.

---

### Step 1-3. capacitor.config.ts 설정

생성된 파일을 다음과 같이 수정합니다:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daily613.app',
  appName: '데일리613',
  webDir: 'dist',
  server: {
    // 개발 중에만 사용 — 출시 전 반드시 제거
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  ios: {
    // iOS 상태바가 웹뷰와 겹치지 않도록
    contentInset: 'automatic',
    // 스크롤 시 배경색
    backgroundColor: '#ffffff',
    // 스킴 설정 (딥링크용)
    scheme: 'daily613'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#6366f1'
    }
  }
};

export default config;
```

---

### Step 1-4. iOS 플랫폼 추가

```bash
# 1) iOS 플랫폼 패키지 설치
npm install @capacitor/ios

# 2) iOS 프로젝트 생성
npx cap add ios

# 3) 웹 빌드 결과물을 iOS 프로젝트에 복사
npx cap sync ios
```

**확인**: `ios/` 폴더가 프로젝트 루트에 생성되었는지 확인하세요.

---

### Step 1-5. Xcode에서 첫 빌드 테스트

```bash
# Xcode에서 iOS 프로젝트 열기
npx cap open ios
```

Xcode가 열리면:
1. 좌측 상단에서 **시뮬레이터 디바이스** 선택 (예: iPhone 16 Pro)
2. **▶ Run 버튼** 클릭
3. 시뮬레이터에서 앱이 정상적으로 실행되는지 확인

**자주 발생하는 문제:**
- `Pod install` 에러 → `cd ios/App && pod install` 수동 실행
- 빌드 실패 → Xcode에서 Signing & Capabilities 탭의 Team 설정 확인
- 빈 화면 → `npx cap sync ios`를 다시 실행

---

### Step 1-6. 필수 네이티브 플러그인 설치

하나씩 설치하며 동작을 확인하세요:

```bash
# (1) 상태바 제어
npm install @capacitor/status-bar

# (2) 스플래시 스크린
npm install @capacitor/splash-screen

# (3) 키보드 제어 (입력 시 레이아웃 조정)
npm install @capacitor/keyboard

# (4) 햅틱 피드백 (루틴 체크 시 진동)
npm install @capacitor/haptics

# (5) 로컬 알림 (루틴 리마인더)
npm install @capacitor/local-notifications

# 설치 후 반드시 sync
npx cap sync ios
```

---

### Step 1-7. 네이티브 플러그인 코드 통합

#### (A) 햅틱 피드백 — 루틴 체크 시 진동

`src/utils/haptics.ts` 파일을 새로 생성:

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const hapticLight = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

export const hapticMedium = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
};

export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: 'SUCCESS' });
  }
};
```

적용 위치: `RoutineCheckItem.tsx`에서 체크 상태 변경 시 `hapticLight()` 호출

#### (B) 상태바 — 테마 연동

`src/utils/statusBar.ts` 파일을 새로 생성:

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const setStatusBarStyle = async (isDark: boolean) => {
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light
    });
  }
};
```

적용 위치: `useTheme.ts` 훅에서 다크모드 전환 시 호출

#### (C) 로컬 알림 — 루틴 리마인더

`src/utils/notifications.ts` 파일을 새로 생성:

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermission = async () => {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }
  return false;
};

export const scheduleRoutineReminder = async (
  id: number,
  title: string,
  body: string,
  hour: number,
  minute: number
) => {
  if (!Capacitor.isNativePlatform()) return;

  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: {
        on: { hour, minute },
        repeats: true
      }
    }]
  });
};

export const cancelAllReminders = async () => {
  if (Capacitor.isNativePlatform()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  }
};
```

---

### Step 1-8. 앱 아이콘 및 스플래시 스크린 생성

```bash
# 아이콘/스플래시 자동 생성 도구 설치
npm install -D @capacitor/assets
```

**준비물:**
1. `assets/icon-only.png` — 1024x1024, 앱 아이콘 원본 (투명 배경 가능)
2. `assets/icon-foreground.png` — 1024x1024, 전경 이미지 (어댑티브 아이콘용)
3. `assets/icon-background.png` — 1024x1024, 배경 이미지
4. `assets/splash.png` — 2732x2732, 스플래시 스크린 이미지
5. `assets/splash-dark.png` — 2732x2732, 다크모드 스플래시 (선택)

> 현재 `public/icon-512.svg`를 기반으로 PNG 변환 후 사용하세요.
> 무료 도구: Figma, Canva, 또는 Inkscape에서 SVG → PNG 변환

```bash
# 모든 플랫폼용 아이콘/스플래시 자동 생성
npx capacitor-assets generate
```

---

### Step 1-9. 개발 워크플로우 설정

매번 코드 수정 후:

```bash
# 1) 웹 빌드
npm run build

# 2) iOS 프로젝트에 동기화
npx cap sync ios

# 3) Xcode에서 실행
npx cap open ios
```

**팁:** 개발 중에는 `capacitor.config.ts`의 `server.url`을 활성화하면 핫 리로드가 가능합니다:

```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:5173',  // 개발 중에만!
  cleartext: true
}
```

> **주의**: 출시 빌드 전에 반드시 `server` 블록을 제거하세요!

---

### Step 1-10. Phase 1 완료 체크리스트

- [ ] Capacitor 설치 및 초기화 완료
- [ ] iOS 시뮬레이터에서 앱 정상 실행
- [ ] 햅틱 피드백 동작 확인
- [ ] 상태바 색상 테마 연동 확인
- [ ] 스플래시 스크린 표시 확인
- [ ] 앱 아이콘이 홈 화면에 정상 표시
- [ ] 로컬 알림 권한 요청 및 발송 확인

---

## Phase 2: 앱스토어 필수 요구사항 (2주)

Apple 심사에서 반드시 통과해야 하는 항목들입니다.
**이 단계를 건너뛰면 100% 리젝됩니다.**

---

### Step 2-1. Apple Developer Program 등록

1. https://developer.apple.com/programs/ 접속
2. **Enroll** 클릭
3. Apple ID로 로그인 (없으면 생성)
4. **개인(Individual)** 또는 **조직(Organization)** 선택
   - 개인 개발자라면 Individual 선택
5. 연간 $99 (약 ₩129,000) 결제
6. 승인까지 **24~48시간** 소요

**등록 완료 후 할 일:**
- [ ] App Store Connect (https://appstoreconnect.apple.com) 접속 확인
- [ ] Xcode에서 Apple ID 추가: Xcode > Settings > Accounts > "+" 버튼

---

### Step 2-2. 인증서 및 프로비저닝 프로파일

Xcode에서 자동으로 관리하는 것을 권장합니다:

1. Xcode에서 프로젝트 열기: `npx cap open ios`
2. 좌측 프로젝트 네비게이터에서 **App** 선택
3. **Signing & Capabilities** 탭 클릭
4. **Automatically manage signing** 체크
5. **Team** 드롭다운에서 본인의 Developer 계정 선택
6. **Bundle Identifier**: `com.daily613.app` 확인

> Xcode가 자동으로 Development/Distribution 인증서와 프로비저닝 프로파일을 생성합니다.

---

### Step 2-3. Sign in with Apple 구현 (**심사 필수**)

Google 로그인을 제공하므로 Apple 로그인이 **반드시** 필요합니다.

#### (A) Firebase Console 설정

1. https://console.firebase.google.com 접속
2. daily613 프로젝트 선택
3. **Authentication** > **Sign-in method** 탭
4. **Apple** 프로바이더 활성화
5. **Services ID** 입력 (아래에서 생성)

#### (B) Apple Developer Console 설정

1. https://developer.apple.com/account 접속
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** > **App IDs** > 기존 App ID 선택 (또는 새로 생성)
4. **Sign in with Apple** 체크박스 활성화
5. **Keys** > **+** 버튼 > **Sign in with Apple** 체크 > 키 생성
6. 생성된 Key ID와 .p8 파일 다운로드 (한 번만 다운로드 가능!)

#### (C) Xcode Capability 추가

1. Xcode에서 프로젝트 열기
2. **Signing & Capabilities** 탭
3. **+ Capability** 버튼 클릭
4. **Sign in with Apple** 검색하여 추가

#### (D) 코드 구현

`src/lib/firebase.ts`에 Apple 프로바이더 추가:

```typescript
import { OAuthProvider } from 'firebase/auth';

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
```

`src/contexts/AuthContext.tsx`에 Apple 로그인 함수 추가:

```typescript
const loginWithApple = async () => {
  await signInWithPopup(auth, appleProvider);
};
```

`src/components/auth/AuthPage.tsx`에 Apple 로그인 버튼 추가:

```tsx
<button
  onClick={loginWithApple}
  className="w-full flex items-center justify-center gap-2 py-3 px-4
             bg-black text-white rounded-xl font-medium"
>
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24
             0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05
             7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93
             3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38
             5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03
             7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34
             4.5-3.74 4.25z"/>
  </svg>
  Apple로 로그인
</button>
```

---

### Step 2-4. 계정 삭제 기능 구현 (**심사 필수**)

#### (A) Firestore 데이터 삭제 함수

`src/lib/firestore.ts`에 추가:

```typescript
import { deleteDoc, doc } from 'firebase/firestore';

export const deleteUserData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};
```

#### (B) Auth Context에 삭제 함수 추가

`src/contexts/AuthContext.tsx`에 추가:

```typescript
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth';

const deleteAccount = async () => {
  if (!user) return;

  // Firestore 데이터 먼저 삭제
  await deleteUserData(user.uid);

  // Firebase Auth 계정 삭제
  // (최근 로그인이 아니면 재인증 필요)
  try {
    await deleteUser(user);
  } catch (error: any) {
    if (error.code === 'auth/requires-recent-login') {
      // 재인증 후 삭제
      await reauthenticateWithPopup(user, googleProvider);
      await deleteUser(user);
    } else {
      throw error;
    }
  }
};
```

#### (C) 설정 탭에 삭제 버튼 추가

`src/components/settings/SettingsTab.tsx`에 추가:

```tsx
{/* 위험 영역 — 설정 탭 하단에 배치 */}
<div className="mt-8 pt-6 border-t border-red-200 dark:border-red-800">
  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
    위험 영역
  </h3>
  <button
    onClick={() => setShowDeleteConfirm(true)}
    className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20
               text-red-600 dark:text-red-400 rounded-xl
               text-sm font-medium"
  >
    계정 및 모든 데이터 삭제
  </button>
</div>

{/* 삭제 확인 다이얼로그 */}
{showDeleteConfirm && (
  <ConfirmDialog
    title="정말 계정을 삭제하시겠습니까?"
    message="모든 루틴, 기록, 회고 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
    confirmLabel="계정 삭제"
    onConfirm={handleDeleteAccount}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}
```

---

### Step 2-5. 개인정보 처리방침 작성

#### (A) 웹페이지 생성

`public/privacy.html` 파일을 생성합니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>데일리613 개인정보 처리방침</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 700px;
           margin: 0 auto; padding: 20px; line-height: 1.7; color: #333; }
    h1 { font-size: 24px; }
    h2 { font-size: 18px; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>데일리613 개인정보 처리방침</h1>
  <p>시행일: 2026년 __월 __일</p>

  <h2>1. 수집하는 개인정보</h2>
  <ul>
    <li>이메일 주소 (회원가입 및 로그인)</li>
    <li>이름/닉네임 (프로필 표시)</li>
    <li>Google/Apple 계정 정보 (소셜 로그인 시)</li>
  </ul>

  <h2>2. 수집 목적</h2>
  <ul>
    <li>사용자 인증 및 계정 관리</li>
    <li>루틴 데이터 저장 및 동기화</li>
    <li>앱 서비스 제공</li>
  </ul>

  <h2>3. 보관 기간</h2>
  <p>회원 탈퇴 시 즉시 삭제합니다. 관련 법령에 의한 보관 의무가 있는 경우 해당 기간 보관 후 삭제합니다.</p>

  <h2>4. 제3자 제공</h2>
  <ul>
    <li><strong>Firebase (Google)</strong>: 인증 및 데이터 저장 (서버 위치: 미국)</li>
    <li><strong>Discord</strong>: 사용자가 직접 설정한 웹훅으로 리포트 전송 (선택 기능)</li>
  </ul>
  <p>그 외 제3자에게 개인정보를 제공하지 않습니다.</p>

  <h2>5. 사용자 권리</h2>
  <ul>
    <li>앱 설정에서 언제든지 계정 및 모든 데이터를 삭제할 수 있습니다.</li>
    <li>데이터 내보내기(JSON/CSV) 기능을 통해 본인 데이터를 다운로드할 수 있습니다.</li>
  </ul>

  <h2>6. 연락처</h2>
  <p>개인정보 관련 문의: [이메일 주소를 입력하세요]</p>

  <h2>7. 변경사항</h2>
  <p>본 방침이 변경되는 경우 앱 내 공지를 통해 안내합니다.</p>
</body>
</html>
```

#### (B) 앱 내 링크 추가

설정 탭 하단에 개인정보 처리방침 링크를 추가합니다:

```tsx
<a
  href="https://your-domain.vercel.app/privacy.html"
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm text-gray-500 underline"
>
  개인정보 처리방침
</a>
```

---

### Step 2-6. Phase 2 완료 체크리스트

- [ ] Apple Developer Program 등록 완료 및 승인 확인
- [ ] Xcode에서 Signing 자동 관리 설정 완료
- [ ] Sign in with Apple 로그인 동작 확인
- [ ] 계정 삭제 기능 동작 확인 (테스트 계정으로 테스트)
- [ ] 개인정보 처리방침 페이지 호스팅 및 접근 확인
- [ ] 앱 내 개인정보 처리방침 링크 동작 확인

---

## Phase 3: 품질 및 안정성 확보 (2주)

---

### Step 3-1. 테스트 환경 구축

```bash
# Vitest + React Testing Library 설치
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

`vite.config.ts`에 테스트 설정 추가:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // ... 기존 설정 유지
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

`src/test/setup.ts` 생성:

```typescript
import '@testing-library/jest-dom';
```

`package.json`에 테스트 스크립트 추가:

```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

---

### Step 3-2. 핵심 기능 테스트 작성 (우선순위 순)

**필수 테스트 목록:**

| # | 테스트 파일 | 테스트 내용 |
|---|-----------|-----------|
| 1 | `src/utils/__tests__/date.test.ts` | 날짜 유틸 함수 정상 동작 |
| 2 | `src/stores/__tests__/routineStore.test.ts` | 루틴 CRUD, 체크, 통계 계산 |
| 3 | `src/components/auth/__tests__/AuthPage.test.tsx` | 로그인/회원가입 폼 렌더링 |
| 4 | `src/components/today/__tests__/TodayTab.test.tsx` | 오늘 탭 루틴 목록 표시 |
| 5 | `src/utils/__tests__/export.test.ts` | 데이터 내보내기 포맷 검증 |

---

### Step 3-3. 오프라인 지원 (Service Worker)

```bash
npm install -D vite-plugin-pwa
```

`vite.config.ts` 수정:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: { cacheName: 'firestore-cache' }
          }
        ]
      }
    })
  ],
  // ...
});
```

Firestore 오프라인 캐시 활성화 — `src/lib/firestore.ts`에 추가:

```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

// 앱 초기화 시 1회 호출
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open — offline disabled');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support offline');
  }
});
```

---

### Step 3-4. 성능 점검

```bash
# 빌드 후 프리뷰 서버에서 Lighthouse 점검
npm run build && npm run preview
```

Chrome DevTools > Lighthouse 탭에서 다음 점수 목표:
- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **PWA**: 통과

**주요 체크 항목:**
- [ ] 초기 로딩 3초 이내 (LCP)
- [ ] 인터랙션 지연 200ms 이내 (INP)
- [ ] 레이아웃 시프트 없음 (CLS < 0.1)
- [ ] 이미지에 width/height 명시
- [ ] 사용하지 않는 JS/CSS 제거

---

### Step 3-5. 접근성 개선

**최소 요구 사항:**

- [ ] 모든 버튼에 `aria-label` 추가 (아이콘만 있는 버튼 대상)
- [ ] 폼 입력 필드에 `<label>` 연결
- [ ] 색상 대비 비율 4.5:1 이상 확인 (6가지 테마 모두)
- [ ] 탭 키 네비게이션 순서 확인
- [ ] iOS 시뮬레이터에서 VoiceOver 켜고 모든 화면 탐색 테스트

---

### Step 3-6. 버전 업데이트

`package.json`:
```json
"version": "1.0.0"
```

Xcode에서:
1. 프로젝트 > General > Identity
2. **Version**: `1.0.0`
3. **Build**: `1`

---

### Step 3-7. Phase 3 완료 체크리스트

- [ ] 테스트 프레임워크 설정 완료
- [ ] 핵심 기능 테스트 통과
- [ ] `npm run test:run` 전체 통과
- [ ] Service Worker 오프라인 캐시 동작 확인
- [ ] Lighthouse 점수 90+ 달성
- [ ] 접근성 기본 항목 통과
- [ ] 버전 1.0.0 설정 완료

---

## Phase 4: 앱스토어 심사 준비 (1주)

---

### Step 4-1. App Store Connect에서 앱 등록

1. https://appstoreconnect.apple.com 접속
2. **앱** > **+** > **신규 앱**
3. 다음 정보 입력:

| 필드 | 값 |
|------|-----|
| 플랫폼 | iOS |
| 이름 | 데일리613 - 루틴트래커 |
| 기본 언어 | 한국어 |
| 번들 ID | com.daily613.app |
| SKU | daily613-v1 |
| 사용자 액세스 | 전체 액세스 |

---

### Step 4-2. 앱 정보 입력

**App Store 탭에서:**

- [ ] **부제**: 맞벌이 육아인의 주체적인 일상
- [ ] **카테고리**: 라이프스타일 (주), 건강 및 피트니스 (부)
- [ ] **앱 설명**: (Phase 4-3 참조)
- [ ] **키워드**: 루틴,트래커,습관,육아,맞벌이,일상,회고,생산성,시간관리,데일리
- [ ] **지원 URL**: https://your-domain.vercel.app
- [ ] **개인정보 처리방침 URL**: https://your-domain.vercel.app/privacy.html

**가격 및 사용 가능 여부:**
- [ ] 가격: 무료
- [ ] 사용 가능 지역: 대한민국 (추후 확장 가능)

**연령 등급:**
- [ ] 모든 항목 "아니오" 선택 → 결과: 4+

---

### Step 4-3. 앱 설명 최종본

```
루틴을 기록하고, 성장하는 일상을 만들어보세요.

데일리613은 맞벌이 부모를 위한 루틴 트래커입니다.
바쁜 하루 속에서도 나만의 루틴을 꾸준히 실천할 수 있도록 도와드립니다.

■ 오늘의 루틴 체크
루틴마다 4단계(미완료/완료/더/최대) 완료 수준을 기록합니다.
"했다/안 했다"가 아닌, 얼마나 했는지를 유연하게 추적하세요.

■ 시간 추적
각 루틴에 투자한 시간을 타이머로 정확히 측정합니다.
어디에 시간을 쓰고 있는지 한눈에 파악하세요.

■ 주간 통계
캘린더와 그리드 뷰로 한 주의 성과를 시각화합니다.
꾸준함의 패턴을 발견하세요.

■ KPT 회고
Keep(유지) / Problem(문제) / Try(시도) 프레임워크로
매일, 매주 돌아보며 더 나은 루틴을 설계하세요.

■ 디스코드 리포트
주간 루틴 성과를 디스코드 채널로 공유합니다.
함께 루틴을 실천하는 커뮤니티와 동기부여하세요.

■ 다크 모드 & 테마
6가지 컬러 테마와 다크 모드를 지원합니다.
나만의 스타일로 앱을 꾸며보세요.
```

---

### Step 4-4. 스크린샷 준비

**필요한 스크린샷:**

| # | 화면 | 마케팅 문구 |
|---|------|-----------|
| 1 | 오늘 탭 (루틴 체크) | "오늘의 루틴, 유연하게 기록하세요" |
| 2 | 시간 추적 탭 | "시간 투자를 정확하게 측정" |
| 3 | 통계 캘린더 뷰 | "한 주의 성과를 한눈에" |
| 4 | KPT 회고 화면 | "매일 돌아보며 성장하세요" |
| 5 | 다크모드 + 테마 | "나만의 스타일로 꾸미기" |

**스크린샷 제작 방법:**

1. iOS 시뮬레이터에서 각 화면 캡처 (`Cmd + S`)
2. 마케팅 문구 오버레이 추가 (Figma/Canva 활용)
3. 필요 사이즈로 리사이즈:
   - 6.9" (1320 x 2868) — 필수
   - 6.3" (1206 x 2622) — 필수

> 무료 도구 추천: https://screenshots.pro, Figma 템플릿, 또는 AppMockUp

---

### Step 4-5. 심사용 데모 계정 준비

1. Firebase Console > Authentication에서 테스트 계정 생성:
   - 이메일: `review@daily613.app`
   - 비밀번호: `Review613!`
2. 해당 계정으로 앱에 로그인하여 샘플 데이터 입력:
   - 루틴 3~5개 생성
   - 최근 7일간의 체크 기록 입력
   - 회고 1~2개 작성
3. App Store Connect > 심사 정보에 입력:
   - 로그인 필요 여부: 예
   - 사용자 이름: `review@daily613.app`
   - 비밀번호: `Review613!`
   - 심사 참고 사항: "이메일/비밀번호로 로그인해주세요. 샘플 루틴 데이터가 포함되어 있습니다."

---

### Step 4-6. 앱 빌드 및 업로드

```bash
# 1) 최종 웹 빌드
npm run build

# 2) iOS 프로젝트 동기화
npx cap sync ios

# 3) Xcode 열기
npx cap open ios
```

**Xcode에서:**

1. 상단 디바이스를 **Any iOS Device (arm64)** 로 변경
2. **Product** > **Archive** 클릭
3. Archive 완료 후 **Distribute App** 클릭
4. **App Store Connect** 선택 > **Upload** 클릭
5. 업로드 완료까지 대기 (5~15분)

> 업로드 후 App Store Connect에서 빌드가 "처리 중"으로 표시됩니다.
> 처리 완료까지 최대 1시간 소요될 수 있습니다.

---

### Step 4-7. App Store Connect에서 빌드 연결

1. App Store Connect > 앱 > iOS 앱 1.0 준비 중
2. **빌드** 섹션에서 **+** 클릭
3. 업로드한 빌드 선택
4. **수출 규정 준수** 정보 입력:
   - 암호화 사용 여부: 예 (HTTPS/TLS 사용)
   - 면제 대상: 예 (표준 암호화만 사용)

---

### Step 4-8. 심사 제출

모든 필수 정보가 입력되었는지 최종 확인:

- [ ] 앱 설명, 키워드, 카테고리
- [ ] 스크린샷 (최소 6.9", 6.3" 각 3장 이상)
- [ ] 개인정보 처리방침 URL
- [ ] 지원 URL
- [ ] 심사 연락처 (전화번호, 이메일)
- [ ] 데모 계정 정보
- [ ] 빌드 연결
- [ ] 연령 등급 설정
- [ ] 가격 설정

모두 완료되었으면 **"심사를 위해 제출"** 버튼 클릭.

> 심사 소요 시간: 보통 24~48시간, 최대 7일

---

### Step 4-9. Phase 4 완료 체크리스트

- [ ] App Store Connect 앱 등록 완료
- [ ] 모든 메타데이터 입력 완료
- [ ] 스크린샷 업로드 완료
- [ ] 심사용 데모 계정 준비 완료
- [ ] Xcode Archive 및 업로드 성공
- [ ] 심사 제출 완료

---

## Phase 5: 베타 테스트 및 정식 출시 (2주)

> 심사 제출 전에 먼저 TestFlight 베타 테스트를 진행하는 것을 강력히 권장합니다.

---

### Step 5-1. TestFlight 내부 테스트

**심사 제출 전에 먼저 수행하세요:**

1. Xcode에서 Archive > Distribute App > **App Store Connect** 업로드
2. App Store Connect > **TestFlight** 탭
3. 빌드 처리 완료 대기
4. **내부 테스트** 그룹 생성:
   - 그룹 이름: "내부 테스터"
   - 테스터 추가 (Apple ID 이메일, 최대 100명)
5. 테스터들에게 자동으로 이메일 발송됨 → TestFlight 앱에서 설치

**내부 테스트 체크리스트 (테스터에게 전달):**

```
[ ] 회원가입 (이메일, Google, Apple 각각)
[ ] 로그인/로그아웃
[ ] 루틴 생성/수정/삭제
[ ] 오늘 탭에서 루틴 체크 (4단계 모두)
[ ] 시간 추적 시작/종료
[ ] 통계 탭 주간 데이터 확인
[ ] 회고 작성 (일간/주간)
[ ] 설정 변경 (테마, 다크모드)
[ ] 데이터 내보내기 (JSON/CSV)
[ ] 계정 삭제
[ ] 앱 강제 종료 후 재실행
[ ] 네트워크 끊긴 상태에서 사용
[ ] 다른 디바이스에서 로그인 시 데이터 동기화
```

---

### Step 5-2. TestFlight 외부 베타 테스트

1. App Store Connect > TestFlight > **외부 테스트**
2. 그룹 생성 > 테스터 추가 (최대 10,000명)
3. 외부 베타는 **Apple 베타 심사**가 필요 (보통 24~48시간)
4. 최소 2주간 운영하며 피드백 수집

**피드백 수집 방법:**
- TestFlight 내장 피드백 (스크린샷 포함)
- 디스코드 채널 운영
- 구글 폼 설문

---

### Step 5-3. 피드백 반영 및 수정

베타 테스트에서 발견된 이슈를 수정합니다:

1. 크래시 리포트 분석 (Xcode Organizer > Crashes)
2. 버그 수정 및 UX 개선
3. 수정 후 새 빌드 업로드 → TestFlight 자동 업데이트

```bash
# 수정 후 빌드 번호 증가 (Xcode에서)
# Version: 1.0.0 유지
# Build: 1 → 2 → 3 ...

npm run build
npx cap sync ios
# Xcode에서 Archive > Upload
```

---

### Step 5-4. 정식 출시

베타 테스트가 안정화되면:

1. App Store Connect에서 최종 빌드 선택
2. **출시 방법** 선택:
   - **수동 출시**: 직접 출시 버튼 클릭
   - **자동 출시**: 심사 승인 즉시 출시
   - **단계적 출시**: 7일에 걸쳐 점진적 배포 (권장)
3. **"심사를 위해 제출"** 클릭
4. 심사 승인 대기 (24~48시간)
5. 승인되면 출시!

---

### Step 5-5. 출시 후 즉시 할 일

#### (A) 모니터링 설정

```bash
# Firebase Crashlytics 설치 (크래시 추적)
npm install @capacitor-firebase/crashlytics

# Firebase Analytics 설치 (사용자 분석)
npm install @capacitor-firebase/analytics
```

#### (B) 일일 체크 루틴

출시 후 첫 2주간 매일 확인:

- [ ] App Store Connect > 크래시 리포트
- [ ] App Store Connect > 사용자 리뷰 및 평점
- [ ] Firebase Console > 활성 사용자 수
- [ ] Firebase Console > 에러 로그

#### (C) 리뷰 대응

- 1~2성 리뷰에는 24시간 내 답변
- 버그 리포트 성격의 리뷰는 수정 후 답변에 업데이트 안내
- 긍정적 리뷰에도 감사 답변

---

### Step 5-6. Phase 5 완료 체크리스트

- [ ] TestFlight 내부 테스트 완료
- [ ] TestFlight 외부 베타 테스트 완료 (최소 2주)
- [ ] 크리티컬 버그 모두 수정
- [ ] 정식 심사 제출
- [ ] 심사 승인
- [ ] App Store 출시 완료
- [ ] Crashlytics / Analytics 모니터링 동작 확인
- [ ] 첫 사용자 리뷰 대응

---

## 부록: 자주 묻는 질문

### Q: Mac이 없으면 어떻게 하나요?
A: iOS 앱 빌드에는 Mac + Xcode가 필수입니다. 대안으로:
- Mac 클라우드 서비스 (MacStadium, AWS EC2 Mac) 이용
- 중고 Mac Mini 구매 (가장 경제적)
- 먼저 Google Play Store (Android)로 출시 후 Mac 확보 시 iOS 출시

### Q: 심사가 거부되면 어떻게 하나요?
A: 거부 사유가 상세히 안내됩니다. 대부분 1~3일 내 수정 가능합니다.
흔한 거부 사유와 해결법:
- **4.2 Minimum Functionality** → 네이티브 기능 추가 (알림, 햅틱 등)
- **5.1.1 Privacy** → 개인정보 처리방침 보완
- **2.1 Performance** → 크래시 수정, 빈 화면 해결

### Q: 업데이트는 어떻게 하나요?
A: Version/Build 번호를 올리고 동일한 Archive > Upload 과정을 반복합니다.
업데이트 심사는 보통 신규 앱 심사보다 빠릅니다 (24시간 내).
