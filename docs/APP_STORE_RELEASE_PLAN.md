# Daily613 앱스토어 정식 출시 계획

> 작성일: 2026-03-18
> 앱 이름: 데일리613 루틴트래커
> 현재 버전: 0.0.0 (Pre-release)
> 현재 형태: React PWA (Vite + TypeScript)

---

## 목차

1. [현황 분석 및 출시 전략](#1-현황-분석-및-출시-전략)
2. [Phase 1: 네이티브 앱 전환](#2-phase-1-네이티브-앱-전환)
3. [Phase 2: 앱스토어 필수 요구사항 충족](#3-phase-2-앱스토어-필수-요구사항-충족)
4. [Phase 3: 품질 및 안정성 확보](#4-phase-3-품질-및-안정성-확보)
5. [Phase 4: 앱스토어 심사 준비](#5-phase-4-앱스토어-심사-준비)
6. [Phase 5: 출시 및 운영](#6-phase-5-출시-및-운영)
7. [타임라인](#7-타임라인)
8. [비용 산정](#8-비용-산정)
9. [리스크 및 대응 방안](#9-리스크-및-대응-방안)

---

## 1. 현황 분석 및 출시 전략

### 현재 앱 상태

| 항목 | 상태 |
|------|------|
| 프레임워크 | React 19 + TypeScript + Vite |
| 스타일링 | TailwindCSS 4 |
| 상태관리 | Zustand |
| 백엔드 | Firebase (Auth + Firestore) |
| 배포 | Vercel (웹) |
| PWA 지원 | manifest.json + standalone 모드 |
| 인증 | Google OAuth (Firebase Auth) |
| 버전 | 0.0.0 |

### 출시 전략: Capacitor를 이용한 네이티브 래핑

현재 React PWA를 네이티브 앱으로 전환하기 위한 최적 방법으로 **Capacitor**를 선택합니다.

**Capacitor 선택 이유:**
- 기존 React 웹 코드를 그대로 활용 가능 (코드 재작성 불필요)
- iOS/Android 동시 지원
- 네이티브 API 접근 가능 (푸시 알림, 로컬 알림 등)
- Ionic 팀이 관리하는 안정적인 오픈소스
- Apple 앱스토어 심사 통과 실적이 풍부

**대안 비교:**

| 방법 | 장점 | 단점 |
|------|------|------|
| **Capacitor** (권장) | 기존 코드 100% 활용, 네이티브 플러그인 | 약간의 설정 필요 |
| PWABuilder | 가장 간단 | Apple 심사 거부 가능성 높음 |
| React Native 재작성 | 완전한 네이티브 경험 | 전체 재작성 필요, 비용 큼 |
| Flutter 재작성 | 높은 성능 | 전체 재작성 필요, 기술 스택 변경 |

---

## 2. Phase 1: 네이티브 앱 전환

### 1-1. Capacitor 프로젝트 설정

```bash
# Capacitor 설치
npm install @capacitor/core @capacitor/cli

# Capacitor 초기화
npx cap init "데일리613" "com.daily613.app" --web-dir dist

# iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios

# (선택) Android 플랫폼 추가
npm install @capacitor/android
npx cap add android
```

### 1-2. 필수 Capacitor 플러그인 설치

```bash
# 푸시 알림 (루틴 리마인더)
npm install @capacitor/push-notifications

# 로컬 알림 (오프라인 루틴 알림)
npm install @capacitor/local-notifications

# 상태 표시줄 제어
npm install @capacitor/status-bar

# 스플래시 스크린
npm install @capacitor/splash-screen

# 앱 아이콘/스플래시 자동 생성
npm install @capacitor/assets --save-dev

# 키보드 제어
npm install @capacitor/keyboard

# 햅틱 피드백 (체크 시 진동)
npm install @capacitor/haptics
```

### 1-3. iOS 프로젝트 구성

- `capacitor.config.ts` 설정 파일 생성
- iOS Bundle ID: `com.daily613.app`
- 최소 지원 iOS: 16.0
- Safe Area 대응 (이미 `viewport-fit=cover` 적용됨)
- 다크모드 연동 (이미 구현됨)

### 1-4. 네이티브 기능 통합

| 기능 | 현재 | 네이티브 전환 후 |
|------|------|-----------------|
| 루틴 알림 | 없음 | 로컬 알림으로 리마인더 |
| 햅틱 피드백 | 없음 | 체크/완료 시 진동 |
| 상태바 | 웹 기본 | 앱 테마 색상 연동 |
| 스플래시 스크린 | 없음 | 브랜드 스플래시 |
| 앱 아이콘 | SVG | 네이티브 PNG 아이콘셋 |

---

## 3. Phase 2: 앱스토어 필수 요구사항 충족

### 2-1. Apple 개발자 계정 설정

- [ ] Apple Developer Program 등록 (연간 $99 / ₩129,000)
- [ ] App Store Connect 계정 설정
- [ ] 인증서 및 프로비저닝 프로파일 생성
  - Development Certificate
  - Distribution Certificate
  - App Store Provisioning Profile

### 2-2. 앱 아이콘 준비 (필수)

Apple 요구 사양에 맞는 아이콘 세트 생성:

| 크기 | 용도 |
|------|------|
| 1024x1024 | App Store 등록용 |
| 180x180 | iPhone (@3x) |
| 120x120 | iPhone (@2x) |
| 167x167 | iPad Pro |
| 152x152 | iPad |
| 76x76 | iPad (@1x) |

> 현재 SVG 아이콘을 기반으로 PNG 래스터 아이콘셋 생성 필요.
> `@capacitor/assets` 도구로 자동 생성 가능.

### 2-3. 스플래시 스크린 준비

- 2732x2732 크기의 범용 스플래시 이미지 1장 준비
- `@capacitor/assets`로 모든 디바이스 대응 크기 자동 생성

### 2-4. 개인정보 처리방침 (필수)

Apple 심사에서 **반드시** 요구하는 항목:

```
작성해야 할 내용:
1. 수집하는 개인정보 항목
   - 이메일 주소 (Firebase Auth)
   - Google 계정 정보 (OAuth)
   - 루틴 데이터 (Firestore)
2. 수집 목적
3. 보관 기간
4. 제3자 제공 여부 (Firebase/Google, Discord 웹훅)
5. 사용자 권리 (데이터 삭제 요청 등)
6. 연락처
```

- [ ] 개인정보 처리방침 웹페이지 작성 및 호스팅
- [ ] 앱 내 개인정보 처리방침 링크 추가
- [ ] 계정 삭제 기능 구현 (Apple 필수 요구사항)

### 2-5. 계정 삭제 기능 (Apple 필수)

2022년 6월부터 Apple은 계정 생성을 지원하는 모든 앱에 **계정 삭제 기능**을 필수로 요구합니다.

구현 필요 사항:
- 설정 탭에 "계정 삭제" 버튼 추가
- Firebase Auth 사용자 삭제
- Firestore 내 사용자 데이터 전체 삭제
- 삭제 전 확인 다이얼로그 표시
- 삭제 완료 후 로그아웃 처리

### 2-6. Apple 로그인 지원 (조건부 필수)

**Apple 심사 지침 4.8**: 소셜 로그인(Google 등)을 제공하는 앱은 **Sign in with Apple**도 반드시 제공해야 합니다.

구현 필요 사항:
- [ ] Firebase Auth에 Apple Sign-In 프로바이더 추가
- [ ] Capacitor Sign in with Apple 플러그인 설치
- [ ] AuthPage 컴포넌트에 Apple 로그인 버튼 추가

---

## 4. Phase 3: 품질 및 안정성 확보

### 3-1. 테스트 환경 구축

```bash
# 테스트 프레임워크 설치
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# E2E 테스트 (선택)
npm install -D playwright
```

**최소 테스트 커버리지 목표:**

| 영역 | 테스트 유형 | 우선순위 |
|------|-----------|---------|
| 루틴 CRUD | 단위 테스트 | 높음 |
| 인증 플로우 | 통합 테스트 | 높음 |
| 데이터 동기화 | 통합 테스트 | 높음 |
| 타임 트래킹 | 단위 테스트 | 중간 |
| 통계 계산 | 단위 테스트 | 중간 |
| UI 렌더링 | 스냅샷 테스트 | 낮음 |

### 3-2. 오프라인 지원 강화

앱스토어 앱으로서 오프라인 경험이 중요합니다:

- [ ] Service Worker 등록 (`vite-plugin-pwa` 활용)
- [ ] Firestore 오프라인 캐시 활성화 (`enableIndexedDbPersistence`)
- [ ] 오프라인 상태 표시 UI
- [ ] 네트워크 복구 시 자동 동기화

### 3-3. 성능 최적화

- [ ] Lighthouse 점수 90+ 달성
- [ ] 번들 사이즈 최적화 (현재 chunk splitting 적용됨)
- [ ] 이미지 최적화 및 lazy loading
- [ ] 초기 로딩 시간 3초 이내 목표

### 3-4. 접근성 (Accessibility)

Apple은 접근성을 중요하게 평가합니다:

- [ ] VoiceOver 호환성 확인
- [ ] 적절한 ARIA 레이블 추가
- [ ] 충분한 색상 대비 비율 (4.5:1 이상)
- [ ] Dynamic Type 지원 (텍스트 크기 조절)

### 3-5. 버전 관리

```json
// package.json 버전 업데이트
{
  "version": "1.0.0"
}
```

시맨틱 버저닝 도입:
- **Major**: 큰 기능 변경
- **Minor**: 새 기능 추가
- **Patch**: 버그 수정

---

## 5. Phase 4: 앱스토어 심사 준비

### 4-1. App Store Connect 정보 작성

| 항목 | 내용 |
|------|------|
| **앱 이름** | 데일리613 - 루틴트래커 |
| **부제** | 맞벌이 육아인의 주체적인 일상 |
| **카테고리** | 라이프스타일 (주), 건강 및 피트니스 (부) |
| **가격** | 무료 |
| **연령 등급** | 4+ |
| **언어** | 한국어 (주), 영어 (선택) |

### 4-2. 앱 설명문 (초안)

```
매일의 루틴을 기록하고, 성장하는 일상을 만들어보세요.

데일리613은 맞벌이 부모를 위한 루틴 트래커입니다.
바쁜 하루 속에서도 나만의 루틴을 꾸준히 실천할 수 있도록 도와드립니다.

주요 기능:
• 오늘의 루틴 체크 - 4단계 완료 수준으로 유연한 기록
• 시간 추적 - 각 루틴에 투자한 시간을 정확히 측정
• 주간 통계 - 캘린더와 그리드 뷰로 한눈에 보는 성과
• KPT 회고 - Keep/Problem/Try 프레임워크로 매일 돌아보기
• 디스코드 리포트 - 주간 루틴 리포트를 디스코드로 공유
• Obsidian 연동 - 데일리 노트로 회고 내보내기
• 다크 모드 - 6가지 컬러 테마 지원
```

### 4-3. 스크린샷 준비

Apple 요구 스크린샷 사양:

| 디바이스 | 크기 | 필수 |
|----------|------|------|
| iPhone 6.9" (16 Pro Max) | 1320 x 2868 | 필수 |
| iPhone 6.3" (16 Pro) | 1206 x 2622 | 필수 |
| iPad 13" (M4) | 2064 x 2752 | iPad 지원 시 |

**스크린샷 구성 (최소 3장, 최대 10장):**
1. 오늘의 루틴 체크 화면 (핵심 기능)
2. 시간 추적 화면
3. 주간 통계/캘린더 뷰
4. KPT 회고 화면
5. 설정 및 테마 커스터마이징

> 각 스크린샷에 짧은 마케팅 문구 오버레이 권장

### 4-4. 심사 대비 체크리스트

Apple 심사에서 자주 리젝되는 항목:

- [ ] **4.0 Design**: 최소한의 기능만 있는 웹뷰 앱이 아닌지 확인
  - Capacitor 앱이지만 네이티브 기능(알림, 햅틱) 통합 필수
- [ ] **4.2 Minimum Functionality**: 웹사이트를 단순 래핑한 것이 아닌 독립적 가치 제공
- [ ] **4.8 Sign in with Apple**: 소셜 로그인 시 Apple 로그인 필수
- [ ] **5.1.1 Data Collection**: 개인정보 수집 동의 및 처리방침
- [ ] **5.1.1 Account Deletion**: 계정 삭제 기능 필수
- [ ] **2.1 Performance**: 크래시 없이 안정적 동작
- [ ] **2.3 Accurate Metadata**: 설명과 실제 기능 일치

### 4-5. 심사용 데모 계정

심사팀이 앱을 테스트할 수 있도록:
- 테스트 계정 (이메일/비밀번호) 생성
- 샘플 루틴 데이터 미리 입력
- 심사 메모에 로그인 방법 안내

---

## 6. Phase 5: 출시 및 운영

### 5-1. TestFlight 베타 테스트

정식 출시 전 최소 2주간 베타 테스트:

- [ ] TestFlight에 빌드 업로드
- [ ] 내부 테스터 (최소 5명) 모집
- [ ] 외부 베타 테스터 (최소 20명) 모집
- [ ] 피드백 수집 및 버그 수정
- [ ] 크래시 리포트 모니터링

### 5-2. 출시 전략

**단계적 출시 (Phased Release) 권장:**
1. Day 1: 1% 사용자에게 배포
2. Day 2: 2%
3. Day 3: 5%
4. Day 4: 10%
5. Day 5: 20%
6. Day 6: 50%
7. Day 7: 100%

> 문제 발생 시 즉시 출시 일시정지 가능

### 5-3. 출시 후 모니터링

- [ ] Firebase Crashlytics 연동 (크래시 모니터링)
- [ ] Firebase Analytics 연동 (사용자 행동 분석)
- [ ] App Store Connect에서 리뷰 모니터링
- [ ] 주요 지표 추적:
  - DAU/MAU (일간/월간 활성 사용자)
  - 리텐션 (Day 1, 7, 30)
  - 크래시율 (목표: 0.1% 미만)

### 5-4. 업데이트 계획

출시 후 로드맵:

| 버전 | 기능 | 우선순위 |
|------|------|---------|
| v1.1 | 위젯 지원 (iOS WidgetKit) | 높음 |
| v1.2 | 푸시 알림 루틴 리마인더 | 높음 |
| v1.3 | iCloud 동기화 | 중간 |
| v1.4 | Apple Watch 연동 | 중간 |
| v2.0 | 가족 공유 (맞벌이 부부 연동) | 높음 |

---

## 7. 타임라인

```
Phase 1: 네이티브 앱 전환         [2주]
├── Capacitor 설정 및 iOS 빌드    (3일)
├── 네이티브 플러그인 통합         (4일)
├── iOS 환경 테스트 및 디버깅      (3일)
└── 앱 아이콘/스플래시 제작        (2일, 병렬)

Phase 2: 필수 요구사항             [2주]
├── Apple 개발자 계정 등록         (1~2일)
├── Sign in with Apple 구현       (3일)
├── 계정 삭제 기능 구현            (2일)
├── 개인정보 처리방침 작성         (2일)
└── 오프라인 지원 강화             (3일)

Phase 3: 품질 확보                [2주]
├── 테스트 작성                   (5일)
├── 성능 최적화                   (3일)
├── 접근성 개선                   (2일)
└── 버그 수정                     (2일)

Phase 4: 심사 준비                [1주]
├── App Store Connect 정보 입력   (2일)
├── 스크린샷 제작                 (2일)
├── 심사 제출                     (1일)
└── 심사 대기                     (1~7일)

Phase 5: 베타 및 출시             [2주]
├── TestFlight 베타 테스트         (10일)
├── 피드백 반영 및 수정            (3일)
└── 정식 출시                     (1일)

총 예상 기간: 약 9~10주
```

---

## 8. 비용 산정

| 항목 | 비용 | 비고 |
|------|------|------|
| Apple Developer Program | $99/년 (₩129,000) | 필수 |
| Firebase (Spark Plan) | 무료 | 현재 무료 티어 |
| Firebase (Blaze Plan) | 종량제 | 사용자 증가 시 전환 |
| 도메인 (개인정보 처리방침) | ₩15,000~30,000/년 | 기존 Vercel 도메인 활용 가능 |
| 디자인 (아이콘/스크린샷) | ₩0~500,000 | 직접 제작 시 무료 |
| Mac (Xcode 빌드용) | ₩0~ | 이미 보유 시 무료 |

**최소 필수 비용: 약 ₩129,000/년** (Apple Developer Program)

---

## 9. 리스크 및 대응 방안

### 리스크 1: "단순 웹뷰 앱" 심사 거부
- **가능성**: 중간
- **대응**: Capacitor 네이티브 플러그인을 적극 활용하여 네이티브 경험 제공
  - 푸시/로컬 알림, 햅틱 피드백, 상태바 제어 등
  - 최소 2~3개의 네이티브 전용 기능 구현

### 리스크 2: Apple 로그인 구현 이슈
- **가능성**: 낮음
- **대응**: Firebase Auth의 Apple 프로바이더 사용으로 구현 복잡도 낮춤

### 리스크 3: 성능 이슈 (웹뷰 기반)
- **가능성**: 낮음
- **대응**:
  - 이미 Vite 번들 최적화 적용
  - chunk splitting으로 초기 로딩 최적화
  - Capacitor는 WKWebView 사용으로 성능 양호

### 리스크 4: 심사 지연
- **가능성**: 중간
- **대응**:
  - 심사 가이드라인 사전 숙지
  - 심사 거부 시 신속한 대응 (평균 1~2일 내 수정 후 재제출)

---

## 다음 단계 (즉시 실행 가능)

1. **Apple Developer Program 등록** 시작
2. **Capacitor 설치 및 iOS 프로젝트 초기화**
3. **앱 아이콘 PNG 래스터 버전 제작**
4. **개인정보 처리방침 초안 작성**
5. **Sign in with Apple 구현 시작**
