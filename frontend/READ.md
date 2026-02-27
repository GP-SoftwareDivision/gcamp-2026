# G-CAMP 2026 Test App 가이드

이 문서는 이 프로젝트를 빠르게 이해하고, 같은 규칙으로 개발/배포하기 위한 통합 안내서입니다.

## 1. 프로젝트 개요

- 스택: Expo + React Native + Expo Router + NativeWind
- 목적: 스마트팜 센서/시장가격/카메라 데이터를 모바일에서 조회하고 활용
- 핵심 탭: 홈, 출하시기(마켓), 카메라, 설정

## 2. 핵심 기술 스택

- UI/라우팅: `react-native`, `expo-router`
- 스타일: `nativewind` (`className` 중심)
- 상태관리: `zustand` (클라이언트 상태), `swr` (서버 캐시/재검증)
- 폼/검증: `react-hook-form`, `zod`
- 네트워크: `axios` 기반 API Core
- 보안 저장소: `expo-secure-store`
- 빌드/배포: `eas build`, `eas update`

## 3. 폴더 구조

- `app/`: 페이지/라우팅 (파일 기반 라우팅)
- `components/`: 공통 UI 컴포넌트
- `services/`: API/스토리지/코어 서비스
- `store/`: Zustand 스토어
- `hooks/`: 커스텀 훅
- `schemas/`: Zod 스키마
- `types/`: 타입 정의
- `constants/`, `styles/`, `shared/`, `utils/`: 공통 상수/스타일/유틸
- `docs/`: 아키텍처/API/디자인 정의 문서
- `android/`: 네이티브 Android 프로젝트 (현재 저장소에서 git ignore 대상)

## 4. 아키텍처 패턴

### 4.1 레이어 분리

- Screen (`app/*`) -> Hook/Store -> Service/API -> Core(`services/api/core`)
- 화면 컴포넌트에서 raw 응답을 직접 다루지 않고, 서비스/유틸에서 정규화 후 사용

### 4.2 인증/세션 처리

- Access/Refresh Token은 `SecureStore`에 저장
- 인증이 필요한 요청은 `Authorization: Bearer <accessToken>` 자동 주입
- `401` 발생 시 `/auth/refresh-token` 1회 재시도
- refresh 실패 시 세션 정리 후 로그인 화면으로 분기

### 4.3 라우팅 구조

- 루트: `app/_layout.tsx`
- 엔트리: `app/index.tsx` (약관 동의/세션 상태 기반 초기 분기)
- 탭: `app/(tabs)/home`, `market`, `camera`, `settings`
- 인증: `app/(auth)/login`, `terms`

## 5. 디자인/컴포넌트 패턴

### 5.1 스타일 규칙

- 기본: NativeWind `className` 우선
- `StyleSheet`는 Android 특수 보정 등 예외 상황에서만 사용
- 인라인 스타일 최소화

### 5.2 공통 UI 재사용

- 공통 컴포넌트 우선 사용: `Card`, `Button`, `Input`, `ScreenScroll`, `SectionLabel`, `DatePicker`, `Select`
- 화면마다 직접 스타일 복붙하지 말고 공통 컴포넌트 확장

### 5.3 테마/접근성

- Light/Dark/System 지원
- 로딩/에러/빈 상태는 화면에 반드시 명시
- 터치영역(`hitSlop`) 확보
- 고령 사용자 고려: 작은 폰트/좁은 터치영역 지양

## 6. API/환경변수 규칙

- Base URL: `EXPO_PUBLIC_API_URL` (fallback: `EXPO_PUBLIC_API_BASE_URL`)
- 현재 `services/api/core/config.ts`는 env 미설정 시 fail-fast 에러
- `.env.local`과 `eas.json`의 profile별 `env`를 같이 관리해야 빌드별 일관성 유지

예시:

```env
EXPO_PUBLIC_API_URL=http://34.64.246.19:7060/api
EXPO_PUBLIC_PROJECT_ID=965bce3c-c8f8-4d4c-b775-d9637b0baa46
```

## 7. 로컬 개발 방법 (Expo)

```bash
npm install
npm run start
```

자주 쓰는 스크립트:

- `npm run android`: Android 에뮬레이터 실행
- `npm run ios`: iOS 시뮬레이터 실행
- `npm run web`: 웹 실행
- `npm run lint`: 린트 체크

변경 반영이 꼬일 때:

```bash
expo start -c
```

## 8. EAS 빌드/업데이트 방법

### 8.1 Android APK (내부 테스트)

```bash
eas build -p android --profile preview
```

### 8.2 Android AAB (스토어 배포)

```bash
eas build -p android --profile production
```

### 8.3 iOS IPA (스토어/테스트플라이트)

```bash
eas build -p ios --profile production
```

참고:

- iOS credentials가 미설정이면 interactive로 1회 설정 필요
- `expo.ios.infoPlist.ITSAppUsesNonExemptEncryption` 설정 누락 시 빌드 프롬프트 발생

### 8.4 OTA 업데이트

네이티브 변경이 없는 JS/TS 변경은 OTA 가능:

```bash
eas update --branch production --message "update message"
```

## 9. 자주 발생하는 이슈

- Android APK에서 HTTP API가 안 되는 경우
  - `android/app/src/main/AndroidManifest.xml`의 `usesCleartextTraffic` 확인
  - `app.json`만 바꿔서는 android 폴더 존재 시 릴리즈에 반영되지 않을 수 있음
- 빌드에서는 로그인 안 되는데 로컬은 되는 경우
  - `eas.json` 해당 profile의 `env` 누락 여부 확인
- 앱 진입 시 화면이 비정상 분기되는 경우
  - access/refresh 세션 검증 로직과 `/auth/refresh-token` 재시도 흐름 확인

## 10. 관련 문서

- [아키텍처 정의서](./docs/01-architecture-definition.md)
- [API 정의서](./docs/02-api-definition.md)
- [디자인 정의서](./docs/03-design-definition.md)
