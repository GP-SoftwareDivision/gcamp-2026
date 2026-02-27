# G-CAMP 프로젝트 통합 가이드

기준일: 2026-02-24

## 1. 문서 목적
- 이 문서는 작업 방식, 아키텍처, API, 디자인 기준을 하나로 합친 단일 기준 문서다.
- 컨텍스트가 길어져도 이 문서만 먼저 확인하면 동일한 방식으로 작업할 수 있게 한다.

## 2. 작업 방식(필수)
### 2.1 시작 전 확인
- 아래 문서를 먼저 읽고 시작한다.
  - `C:/Users/User/gcamp-2026-test-app/.agents/skills/vercel-react-native-skills/SKILL.md`
  - `docs` 폴더 내 최신 md 문서

### 2.2 작업 후 기록
- 작업 결과는 반드시 `docs`의 md 파일에 반영한다.
- 변경 종류별 반영 위치:
  - 아키텍처: `docs/01-architecture-definition.md`
  - API: `docs/02-api-definition.md`
  - 디자인/UI: `docs/03-design-definition.md`
  - 작업 원칙: `docs/00-workflow-guidelines.md`

### 2.3 스타일링 규칙
- 기본은 `tailwindcss + className`으로 구현한다.
- Android(AOS)에서 Tailwind/className만으로 적용되지 않는 스타일은 `StyleSheet`로 분리한다.
- 우선순위:
  1. className
  2. 불가 항목만 StyleSheet

### 2.4 React Compiler 기준
- React Compiler 사용 전제를 따른다.
- `useMemo`, `useCallback`은 기본적으로 지양한다.
- 아래 경우에만 예외적으로 사용한다.
  - 성능 병목이 확인된 경우
  - 라이브러리 제약으로 참조 안정성이 꼭 필요한 경우
  - 사용 시 근거를 코드 또는 문서에 짧게 남긴다.

## 3. 아키텍처 요약
### 3.1 스택
- Expo + React Native + Expo Router
- Zustand(앱 로컬 상태) + SWR(서버 캐시/재검증)
- Axios 기반 API Core + feature service
- SecureStore 기반 인증/동의 상태 저장

### 3.2 레이어
- `app/`: 라우팅, 화면
- `components/`: 공통 UI
- `hooks/`: 테마/SWR 훅
- `services/api/`: HTTP 코어 및 API 서비스
- `services/storage/`: 저장소 접근
- `stores/`: Zustand 스토어
- `types/`: 타입 정의
- `constants/`, `styles/`: 디자인 토큰/스타일 보정

### 3.3 라우팅
- Root: `app/_layout.tsx`
- 엔트리: `app/index.tsx`
  - 미동의: `/(auth)/terms`
  - 동의+세션: `/(tabs)/home`
  - 동의+무세션: `/(auth)/login`
- 탭: home, market, camera, settings

## 4. API 요약
### 4.1 공통 규약
- Base URL: `EXPO_PUBLIC_API_BASE_URL`
- 인증: `Authorization: Bearer <accessToken>`
- 401 발생 시 refresh-token 시도 후 1회 재시도

### 4.2 주요 엔드포인트
- Auth: `/auth/authenticate`, `/auth/refresh-token`
- Farm: `/farm/me`
- Weather: `/weather`
- Sensor: `/sensor/summary`, `/sensor/recent`
- Market:
  - `/market/prices`
  - `/market/prices/recently`
  - `/market/prices/average`
  - `/market/prices/settlements*`
- Admin: `/admin/*`

## 5. 디자인 요약
### 5.1 시스템
- NativeWind + StyleSheet 혼합
- Light/Dark/System 테마
- 토큰 중심 스타일(`constants/design.ts`, `tailwind.config.js`)

### 5.2 컴포넌트 원칙
- 공통 UI(`Card`, `Button`, `Input`, `ScreenScroll`) 우선 재사용
- 화면별 인라인 스타일 남발 금지
- 플랫폼 차이는 `IS_ANDROID` 및 공통 style 유틸에서 처리

### 5.3 접근성/상태
- 로딩/에러/빈 상태를 명시적으로 보여준다.
- 최소 터치 영역 확보(hitSlop 포함)

## 6. 실무 체크리스트
- [ ] SKILL.md 확인
- [ ] docs 기존 문서 확인
- [ ] className 우선 구현
- [ ] AOS 비적용 스타일은 StyleSheet로 분리
- [ ] useMemo/useCallback 불필요 사용 금지
- [ ] 작업 결과를 docs에 반영

## 7. 원본 상세 문서
- `docs/00-workflow-guidelines.md`
- `docs/01-architecture-definition.md`
- `docs/02-api-definition.md`
- `docs/03-design-definition.md`
