# 🏗️ G-CAMP 프로젝트 아키텍처 정의서

최종 수정일: 2026-02-25

## 1. 핵심 기술 스택

- **프레임워크:** Expo + React Native + Expo Router
- **상태 관리:** Zustand (전역 클라이언트 UI 상태 관리), SWR (서버 데이터 패칭 및 캐싱)
- **네트워크/API:** Axios 기반의 API Core + 도메인별 Service 레이어 분리
- **보안/저장소:** `expo-secure-store` 기반의 사용자 인증 토큰(Access/Refresh) 및 로컬 설정 암호화 저장
- **스타일링:** NativeWind (Tailwind CSS) + 공통 디자인 시스템 테마 (`constants/design.ts`)

## 2. 디렉토리 구조 및 역할

- `app/`: 라우팅 및 페이지 컴포넌트 (Expo Router 파일 기반 라우팅)
- `components/`: 공통 UI 컴포넌트 및 도메인별 분리된 프레젠테이셔널 컴포넌트
- `hooks/`: 커스텀 훅 및 SWR 데이터 패칭 비즈니스 로직
- `services/api/`: HTTP 클라이언트 설정(Axios 인스턴스) 및 도메인별 API 호출 함수
- `services/storage/`: SecureStore 래퍼 및 로컬 저장소 유틸리티
- `stores/`: Zustand 전역 상태 저장소 (UI 뷰포트 상태, 인증 상태, 카메라 UI 등)
- `types/`: API 응답 타입 및 UI 인터페이스 공통 타입 정의
- `constants/`, `styles/`: 앱 전역 상수, 레이아웃 상수, 색상/타이포그래피 등 디자인 시스템 정의

## 3. 라우팅 및 내비게이션 구조

- **최상위 레이아웃:** `app/_layout.tsx`
  - `ThemeProvider`, `SWRConfig` 프로바이더 전역 설정
  - 라우트 그룹 논리적 분리: `(auth)`, `(tabs)`
- **진입점 (Entry Point):** `app/index.tsx`
  - 약관 동의 상태(`hasAcceptedPolicies`) 및 사용자 인증 여부에 따른 자동 분기(Redirect) 처리
- **분기 로직:**
  - 약관 미동의 시: `/(auth)/terms` (이용약관 화면)
  - 미인증 (로그아웃) 시: `/(auth)/login` (로그인 화면)
  - 인증 완료 시: `/(tabs)/home` (메인 홈 화면)
- **메인 탭 뷰 (`app/(tabs)`):** `home`, `market`, `camera`, `settings`
- **상세 화면 라우팅:** `market/[grade]`, `home/sensor/[id]`, `chatbot/index`

## 4. 데이터 흐름 및 비즈니스 로직

### 4.1 인증 프로세스

1. 로그인 폼 제출 및 API 호출 (`authApi.authenticate`)
2. 응답받은 Access/Refresh 토큰을 `SecureStore`에 안전하게 저장
3. 전역 상태(Zustand)에 사용자 정보 및 인증 상태 `hydrate` 처리
4. 메인 화면(`/(tabs)/home`)으로 리다이렉트

### 4.2 API 통신 및 토큰 갱신 로직

1. 커스텀 API 호출 래퍼를 통한 공통 설정 및 통신 수행
2. 인증이 필요한 API는 `SecureStore`에서 토큰을 읽어와 `Authorization` 헤더에 자동 주입
3. 토큰 만료 에러(401) 발생 시 `POST /auth/refresh-token` 호출하여 토큰 갱신 시도
4. 갱신 성공 시 이전 요청 재시도, 실패 시 `authUiStore` 초기화 및 강제 로그아웃 처리

### 4.3 센서 및 날씨 데이터 흐름

1. 농장 및 사용자 기본 정보 조회 (`farmApi.getMyFarmInfo`)
2. 최신 센서 데이터(`sensor/recent`) 및 날씨 데이터(`weather`) 주기적 폴링(Polling)
3. SWR 캐싱 데이터와 Zustand 상태를 결합하여 UI에 실시간 렌더링 반영

### 4.4 시장 및 가격 데이터

- **최근 시장 가격 추이:** `market/prices/recently` API 데이터를 Section List 형태로 렌더링
- **평균 가격 시각화:** `market/prices/average` 데이터를 차트 컴포넌트를 통해 연도별/작물별 시각화

## 5. 전역 상태 관리 스토어 (Zustand)

- **`sensorStore`:** 센서 데이터 렌더링을 위한 전역 상태, 필터 및 뷰 모드 설정 관리
- **`marketStore`:** 시장 데이터 조회 조건, 선택된 작물 등 UI View 상태 보관
- **`authUiStore`:** 로그인/로그아웃 진행 상태 및 UI 에러/경고 메시지 보관
- **`cameraUiStore`:** IP 카메라 RTSP 주소, 비디오 스트리밍 연결 상태, 전체화면 여부 및 UI 로딩 상태 보관

## 6. 코딩 컨벤션 및 룰

- API 요청/응답 타입은 `services/api/contracts.ts`에 엄격하게 정의하여 사용
- 컴포넌트 내부에서 API Raw 데이터를 직접 조작하지 않고, 필요시 변환(Formatting) 유틸리티를 거쳐 사용
- 보안이 필요한 민감 상태(토큰 등)는 `SecureStore`와 연동하여 관리
- UI 스타일링은 공통 테마(`constants/design.ts`, `styles/*`) 기반의 Tailwind CSS 클래스를 사용하여 일관성 유지

## 7. 예외 처리 및 로깅 전략

- 글로벌 에러 바운더리를 설정하여 앱 크래시 방지 및 복구 가능한 Fallback UI 제공
- API 에러 응답은 `Record<string, unknown>` 형식으로 안전하게 파싱하여 예외 처리
- `console.log` 및 디버그 로깅은 개발 환경(Development)에서만 동작하도록 환경 변수로 통제하여 운영 환경 노이즈 최소화

---

## 📅 Update Logs (2026-02-24 ~ 2026-02-25)

**[2026-02-24] UI 및 뷰포트 개선**

- Tailwind 설정 중 `danger` 색상을 디자인 시스템 규격에 맞춰 명도/채도 최적화 (Destructive Color 적용).
- Input 컴포넌트 `forwardRef` 적용하여 부모 컴포넌트에서 포커스 제어 가능하도록 개선.
- 안드로이드 기기(갤럭시 등)에서 키보드 올라올 때 화면 가려짐 현상을 해결하기 위해 `KeyboardAvoidingView + ScrollView` 구조로 레이아웃 전면 수정.
- 로그인 화면에서 `ID -> Password -> Submit`으로 이어지는 One-pass 키보드 인터랙션 플로우 개선.

**[2026-02-24] RTSP 카메라 플레이어 상태 관리 연동**

- `farm/me` API 응답에서 `ipcam_address`를 추출하여 SecureStore 및 `cameraUiStore`에 동기화(Hydrate)하는 로직 추가.
- VLC Player의 `onPlaying`, `onBuffering` 이벤트를 Zustand 스토어(`isPlaying`, `bufferRate`, `currentTime`)와 연동하여 실시간 로딩(ActivityIndicator) UI 제어.
- 스트림 연결 지연 시(Timeout) 사용자에게 네트워크 확인을 요청하는 안내 메시지 UI 추가 (`connectionIssueMessage`).
- 화면 첫 진입 및 버퍼링 중단 시 상태가 꼬이지 않도록 `resetStreamState()` 및 `hasPlayedOnce` 참조 변수(Ref) 방어 로직 추가.

**[2026-02-25] 마켓 차트 통합**

- 시장 데이터 평균 차트를 시각화하는 모듈 `shared/marketChart.ts` 연동 작업 완료.
- 연도별 데이터 시리즈 색상 세팅 및 툴팁 렌더링 최적화 로직 반영.

**[2026-02-25] IP 카메라 PTZ 제어 기능 완벽 구현**

- 초기 `ptzClient.ts`의 동작 오류를 폐기하고, 순수 HTTP CGI 통신 기반의 `utils/camera.ts` 유틸리티로 전면 리팩토링.
- **주소 파싱 로직:** RTSP URL(`rtsp://id:pw@ip:port/11`)에서 정규식을 통해 계정, 비밀번호, IP를 분리 추출.
- **인증 및 예외 처리:** 비밀번호에 특수문자(`!`)가 포함된 경우를 대비해 `base-64` 패키지로 HTTP Basic Auth 헤더를 구성하여 안전하게 전송하도록 개선.
- **포트포워딩 대응:** 외부에서 카메라를 제어할 수 있도록 웹 통신 전용 포트(`8080`)를 별도로 할당하여 포트 병목(Network request failed) 문제 해결.
- **카메라 종특 펌웨어 대응:** Zoom 정지 시 발생하는 `404 Not Found` 에러를 방지하기 위해 줌 아웃/인 정지 명령을 범용 `stop` 명령어로 통합 처리.
- 배포 환경(Production)을 대비하여 PTZ 제어용 디버그 로그(`console.log`, `console.warn`)를 최소화하고 정리함.

**[2026-02-26] 공통 입력 컴포넌트 확장**

- `react-native-modal-datetime-picker`, `react-native-element-dropdown`, `@react-native-community/datetimepicker` 의존성을 추가했습니다.
- UI 레이어(`components/ui`)에 공통 래퍼 `DatePicker`, `Select`를 추가해 화면별 중복 구현 없이 재사용하도록 구조를 확장했습니다.
- Expo config plugin에 `@react-native-community/datetimepicker`를 등록했습니다.


## 2026-02-26 Update (Architecture)
- Added a new Market Search route screen at app/(tabs)/market/search.tsx.
- Updated tab routing in app/(tabs)/_layout.tsx to register market/search as a hidden tab route (href: null).
- Extended shared TabHeader (components/ui/TabHeader.tsx) to support an optional right-side pressable action for header-level navigation controls.

## 2026-02-26 Update (Architecture - Market Search Refactor)
- Moved Market Search screen from app/(tabs)/market/search.tsx to app/(tabs)/market/search/index.tsx to align with sub-screen folder architecture.
- Kept route path as /market/search and handled it as a file-based sub-route (no direct Tabs.Screen registration).

## 2026-02-26 Update (Architecture - Search Tab Visibility)
- Added Tabs hidden entry market/search/index in app/(tabs)/_layout.tsx with options={{ href: null, headerShown: false }}.
- Kept Search navigation path as /market/search from market/index.tsx and routed it to the folder-based sub-screen market/search/index.tsx.

## 2026-02-26 Update (Architecture - Market Search Store)
- Added global Zustand store at store/useMarketSearchStore.ts.
- Store state fields: startDate, endDate, itemCode, grade, unitName.
- Added update actions for each field and resetSearch action with default date re-initialization (startDate: 1 month ago, endDate: today).

## 2026-02-26 Update (Architecture - Market Search Module Split)
- `app/(tabs)/market/search/index.tsx` 단일 파일 구조를 모듈 구조로 분리했습니다: `constants.ts`, `types.ts`, `schema.ts`, `utils.ts`, `api.ts`, `hooks.ts`.
- 검색 화면 import 경로를 `@/store/useMarketSearchStore`에서 `@/store/useMarketSearchStore`로 통일했습니다.
- 중복 스토어 파일 `store/useMarketSearchStore.ts`를 제거하고 `stores/useMarketSearchStore.ts` 단일 소스로 정리했습니다.


## 2026-02-26 Update (Architecture - Store Directory Standardization)
- Zustand 상태 파일 디렉터리를 `stores/`에서 `store/`로 단일화했습니다.
- 전역 import 경로를 `@/stores/*`에서 `@/store/*`로 일괄 정리했습니다.
- 빈 `stores` 디렉터리를 제거하고 상태 관리 파일은 `store/`에만 유지합니다.
- 검색 검증 스키마를 화면 폴더에서 분리하여 `schemas/marketSearch.ts`로 이동했습니다.
- `app/(tabs)/market/search/index.tsx`는 `@/schemas/marketSearch`를 사용하도록 변경했습니다.

## 2026-02-26 Update (Architecture - Zod Schema Centralization)
- `app/(auth)/login.tsx`의 `loginSchema`를 `schemas/auth/login.ts`로 분리했습니다.
- 프로젝트 내 `zod` import 사용 위치를 `schemas/` 디렉터리로 일원화했습니다.
- `MarketSearchSchemaInput` 타입을 `schemas/marketSearch.ts`에서 `types/schemas/marketSearch.ts`로 이동하고, 스키마 파일은 타입 import만 사용하도록 정리했습니다.
- `app/(tabs)/market/search/constants.ts`에 `ALL_OPTION_VALUE`를 추가하여 Select 표시값과 API 필터값(`null`)을 분리했습니다.
- `app/(tabs)/market/search`는 라우트 규칙에 맞춰 `index.tsx` 단일 파일만 유지하도록 정리했습니다.
- 시세 검색 전용 로직은 공용 레이어로 분리했습니다: `constants/marketSearch.ts`, `hooks/useMarketSearch.ts`, `utils/marketSearch.ts`, `types/pages/tabs/marketSearch.ts`.
- 스크롤 하단 도달 판별 함수를 `shared/scroll.ts`로 분리해 페이지 공통 재사용이 가능하도록 정리했습니다.
- 시세 검색 화면 blur/unfocus 시점에 검색 상태를 초기화하도록 처리했습니다.
- 초기화 대상: Zustand 필터(`startDate`, `endDate`, `itemCode`, `grade`, `unitName`) + 검색 결과 리스트/페이지 상태.
- `useFocusEffect` cleanup 루프를 방지하기 위해 `useMarketSearchRecords`의 `search`, `loadMore`, `reset` 함수를 `useCallback`으로 고정했습니다.
- 시세 검색 화면 포커스 진입 시점에도 상태 초기화를 추가해, 탭 전환/뒤로가기 후 재진입 시 항상 기본 상태로 시작하도록 보강했습니다.
- 시세 검색 Zod 스키마에 `startDate >= 20230101` 검증을 추가해, 2023년 이전 날짜 선택 시 `데이터는 2023년부터 수집중입니다.` 메시지를 반환하도록 보강했습니다.
- 홈 탭(`app/(tabs)/_layout.tsx`)에 `popToTopOnBlur: true`를 적용해, 비교분석 같은 홈 서브페이지에서 다른 탭으로 이동 후 홈 탭 재진입 시 홈 루트로 복귀하도록 네비게이션 동작을 보정했습니다.
- 인증 세션 복원 로직을 보강해 `accessToken` 유실 상황에서도 `refreshToken`이 남아 있으면 API 호출 전 자동 재발급을 먼저 시도하도록 변경했습니다.
- 앱 진입(`app/index.tsx`) 시 `farm/me` 조회 후에도 유효한 `accessToken`이 없으면 탭 화면으로 진입하지 않고 로그인 화면으로 안전하게 분기하도록 보강했습니다.

- 로그인 화면 부트스트랩에서 refresh-only 세션을 로그인 완료로 오인하지 않도록 보강했습니다. `farm/me` 조회 후 accessToken 유효 여부를 재검증하고, 유효하지 않으면 세션을 정리한 뒤 로그인 화면에 머물도록 변경했습니다.


- Android 릴리즈 APK에서도 HTTP API 통신이 가능하도록 `android/app/src/main/AndroidManifest.xml`의 `<application>`에 `android:usesCleartextTraffic="true"`를 명시했습니다.
- iOS EAS 빌드 프롬프트 제거를 위해 `app.json`의 `expo.ios.infoPlist`에 `ITSAppUsesNonExemptEncryption: false`를 명시했습니다.
- 최상위 `READ.md`를 인덱스 문서에서 통합 온보딩 문서로 재구성했습니다. 아키텍처, 디자인 패턴, 스타일 가이드, Expo/EAS 운영 방법을 한 파일에서 확인할 수 있도록 정리했습니다.
