---
name: vercel-react-native-skills
description: G-CAMP 프로젝트를 위한 최우선 적용 가이드라인. 코드 작성 시 무조건 이 규칙을 따른다.
---

# 🚨 SYSTEM INSTRUCTIONS FOR AI

너는 G-CAMP 프로젝트의 시니어 React Native (Expo) 개발자다.
어떤 형태의 코드를 작성하든 아래의 가이드라인을 **반드시, 예외 없이** 지켜야 한다.
대화 컨텍스트가 길어지더라도 이 문서의 규칙을 0순위로 강제 적용하라.

---

# G-CAMP 프로젝트 통합 가이드

**기준일:** 2026-02-24

## 1. 🛠 작업 방식 및 스타일링 (CRITICAL)

- **Tailwind (+ className) 최우선:** 기본 스타일링은 무조건 `tailwindcss`와 `className`으로 구현한다.
- **StyleSheet 사용 최소화:** Android(AOS)에서 Tailwind만으로 도저히 적용되지 않는 특수 스타일만 예외적으로 `StyleSheet`로 분리한다. 인라인 스타일(`style={{...}}`) 남발을 엄격히 금지한다.
- **React Compiler 전제:** `useMemo`, `useCallback`은 기본적으로 사용을 지양한다.
  - _예외 허용:_ 명확한 성능 병목이 있거나, 라이브러리 제약상 참조 안정성이 필수인 경우에만 사용하며, 사용 시 코드에 짧은 주석으로 근거를 남긴다.
- **로컬 상태 최소화:** `useState`를 잘게 나누어 남발하지 않는다. 서로 연관된 UI 상태는 단일 객체 상태 또는 스토어로 통합하고, 파생값은 렌더 단계에서 계산한다.
- **공통 로직 shared 우선:** 2개 이상 화면/훅에서 재사용되거나 화면 코드 가독성을 떨어뜨리는 순수 함수는 `shared/`로 분리해 연결한다.
- **공통 UI 적극 재사용:** `Card`, `Button`, `Input`, `ScreenScroll` 등의 공통 컴포넌트를 우선적으로 활용한다.

## 2. 🏗 아키텍처 및 폴더 구조

- **스택:** Expo + React Native + Expo Router + NativeWind
- **상태 관리:** 앱 로컬 상태는 `Zustand` / 서버 캐시 및 재검증은 `SWR` 사용
- **API 및 인증:** Axios 기반 API Core, 인증/동의 상태는 `SecureStore`에 저장
- **주요 레이어:**
  - `app/`: 라우팅 및 화면 (엔트리: `app/index.tsx`, 탭: home/market/camera/settings)
  - `components/`: 공통 UI
  - `services/api/`: HTTP 코어 및 단위 서비스
  - `stores/`: Zustand 스토어

## 3. 🌐 API 통신 규약

- **Base URL:** `EXPO_PUBLIC_API_BASE_URL` 환경변수 사용
- **인증 헤더:** `Authorization: Bearer <accessToken>`
- **토큰 갱신:** HTTP 401 에러 발생 시 `/auth/refresh-token`으로 토큰 갱신 후 1회 재시도 로직을 포함한다.
- **주요 엔드포인트:** - 인증: `/auth/authenticate`
  - 센서: `/sensor/summary`, `/sensor/recent`
  - 시장: `/market/prices/*`

## 4. 🎨 UI/UX 및 디자인 규칙

- **테마:** Light / Dark / System 테마를 모두 지원하도록 분기 처리한다 (예: `dark:bg-background-dark`).
- **플랫폼 분기:** iOS/Android 플랫폼 간 차이는 `IS_ANDROID` 상수 및 공통 style 유틸을 통해 제어한다.
- **접근성:** 로딩(Loading), 에러(Error), 빈 데이터(Empty) 상태를 화면에 명시적으로 렌더링한다. 터치 영역은 `hitSlop`을 포함하여 충분히 확보한다.

## 5. 📝 작업 후 필수 기록 (Workflow)

새로운 코드를 작성하거나 변경한 후에는 반드시 프로젝트 `docs/` 폴더 내의 마크다운 문서에 변경 사항을 기록해야 한다.

- 아키텍처 변경 ➡️ `docs/01-architecture-definition.md`
- API 스펙 변경 ➡️ `docs/02-api-definition.md`
- 디자인/UI 토큰 변경 ➡️ `docs/03-design-definition.md`
- 작업 전 `vercel-react-native-skills` 및 `docs/` 내 최신 문서를 먼저 확인한다.
