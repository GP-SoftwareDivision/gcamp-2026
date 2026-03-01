# 🎨 디자인 정의서

기준일: 2026-02-25  
기준 파일: `constants/design.ts`, `tailwind.config.js`, `components/ui/*`

## 1. 디자인 시스템 개요

- **스타일 구성:** NativeWind(`className`) + React Native `StyleSheet` 혼합
- **테마 모드:** Light / Dark / System (`hooks/theme.tsx`)
- **기본 원칙:** 공통 테마 우선 사용, 화면별 하드코딩 최소화

## 2. 타이포그래피와 색상

### 2.1 색상 테마

- **상태 색상:** `success`, `warning`, `danger`, `info`
- **차트 색상:** `ChartColors`를 기준으로 화면 간 일관성 유지
- **다크 모드 대비:** 본문 텍스트와 배경 대비 유지 (가독성 확보)

### 2.2 타이포 테마

- **주요 텍스트 스타일:** `title-lg`, `title-1`, `title-2`, `headline`, `body`, `subhead`, `caption-*`, `display`
- 숫자/단위 조합은 가독성 우선 (값과 단위 분리 포맷팅)

### 2.3 간격 규칙

- 기본 8pt 리듬 유지
- 카드/스크롤 뷰 영역은 공통 간격 테마 사용

## 3. 공통 UI 컴포넌트 규칙

- **Card:** 공통 그림자 및 테두리 라운드 적용
- **Button:** 상태별 스타일 일관성 유지
- **Input:** 오류/활성/비활성 상태 명확화
- **ScreenScroll:** SafeArea + 하단 여백 보정
- **AnimatedValueText:** 숫자 변경 시 애니메이션 효과 적용
- **TabHeader:** 메인 탭 상단 헤더 공통화

## 4. 접근성 및 가독성 규칙

- 터치 영역 최소 44px 권장
- 작은 화면에서는 핵심 정보(입력창, 주요 수치) 우선 노출
- 고령 사용자 가독성을 위해 핵심 수치 텍스트 크기 확대 허용

## 5. 플랫폼 보정 규칙

- Android 보정값은 `AndroidLayout` 및 전역 타이포 설정으로 통합 관리
- iOS/Android 차이는 컴포넌트 내부 분기보다 공통 테마로 흡수

## 6. 차트 UI 규칙

- 데이터 없음 상태는 텍스트 대신 로더 또는 명확한 안내문을 사용
- 툴팁(말풍선)은 짤림 없이 보이도록 너비/높이/폰트를 함께 조정
- 비교 문구 색상은 수치 단위에만 적용 (숫자 강조, 본문은 기본색)

## 7. 문서 관리 원칙

- UI/테마/레이아웃 변경 시 본 문서에 업데이트 로그를 남긴다.
- 로그 문구는 **반드시 한국어**로 작성한다.

---

## 📅 Update Logs (2026-02-24 ~ 2026-02-25)

**[2026-02-24] UI 및 레이아웃 개선**

- **Log 8-9:** 출하구분 목록의 로딩/빈 상태 표시를 단순화하고, 카메라 화면 RTSP 주소를 하드코딩에서 스토어 기반(`cameraUiStore.ipcamAddress`)으로 변경했습니다.
- **Log 10-11:** 홈 날씨 카드의 강수 표시를 API `pop` 값을 우선 사용하도록 정리하고, 설정의 계정 전환 버튼/모달에 `danger` 계열 색상 규칙을 적용했습니다.
- **Log 32-33:** 로그인 UI에 스크롤 기반 키보드 대응을 적용하여 Android에서 화면이 과하게 위로 밀리는 현상을 줄였습니다. Android 키보드 오픈 시 아이디/비밀번호 입력창이 함께 보이도록 로그인 콘텐츠 정렬을 중앙에서 상단 시작(`pt-16`)으로 변경했습니다.
- **Log 34-37:** 하단 탭 레이블 크기 및 아이콘 위치를 미세 조정하여 정렬을 맞췄습니다. 메인 탭(홈/출하구분/카메라/설정) 상단 헤더 컴포넌트(`components/ui/TabHeader.tsx`)를 공통화하고 타이포를 `text-title-1`로 통일했습니다.

**[2026-02-24] 카메라 플레이어 UX 개선**

- **Log 12-21:** 카메라 재생 상태(`isPlaying`) 및 버퍼링(`bufferRate`) 기반으로 로딩 표시 규칙을 보강했습니다. 중복 로딩 오버레이를 제거하고, 화면 전환 시 불필요한 재연결 지연을 완화했습니다. 최초 연결 시에만 로딩 인디케이터를 강하게 호출하도록 정책을 조정했습니다.

**[2026-02-24] 시장 차트 UI 정리**

- **Log 22-29:** 출하구분 상세 차트 색상 체계를 재설정하고, 3개 시리즈의 시각적 구분성을 높였습니다. 비교 문구를 퍼센트 중심 표현으로 단순화하고 줄바꿈 처리를 가독성 있게 보완했습니다.
- **Log 40:** 출하구분 상세 화면(`app/(tabs)/market/[grade].tsx`)에서 불필요한 useMemo, useCallback을 제거하고 파생값을 일반 계산으로 유지하여 구조를 최적화했습니다.

**[2026-02-25] Android 타이포 및 폰트 개선**

- **Log 38:** 앱 루트 레이아웃에 Android 전역 타이포 오버라이드를 적용했습니다. Android의 모든 `Text`/`TextInput` 기본 자간을 `letterSpacing: -1.2`로 설정해 가독성을 높였습니다.

**[2026-02-25] 카메라 PTZ UI 복원 및 테마 적용**

- **Log 41:** 카메라 화면에서 비활성 누락되었던 PTZ 컨트롤 UI를 다시 호출하도록 복구했습니다. 비전체화면 모드에서 상단 비디오, 중간 연결 안내, 하단 원형 PTZ 컨트롤 배치로 레이아웃을 정리했습니다.
- **Log 42:** 카메라 PTZ 컨트롤러를 라이트/다크 테마별로 구분해 시각 스타일을 정리했습니다. 라이트 모드는 밝은 외곽 원형 + 중앙 보조 원형(줌 +/-), 다크 모드는 저채도 다크 원형 스타일로 맞췄습니다.

**[2026-02-25] 센서 데이터 단위 변환 (EC 최적화)**

- **Log 43:** 홈의 센서 카드의 EC(전기전도도) 표시 단위를 `dS/m`로 변경했습니다. EC 센서 API 응답값(`uS/cm`)을 화면 표시 시에 `값 / 1000` 연산하여 `dS/m`로 보여주도록 수정했습니다. 센서 상세(EC) 화면의 상단값/비교값/차트 수치도 모두 변경된 단위(`dS/m`) 기준으로 표기합니다.

## 44. Update Log (2026-02-26)
- 공통 UI 컴포넌트로 `DatePicker`(`components/ui/DatePicker.tsx`)를 추가했습니다.
- `react-native-modal-datetime-picker` 기반으로 `isVisible`, `mode`, `date`, `onConfirm`, `onCancel` props를 래핑했습니다.
- `components/ui/index.ts`에 DatePicker export를 추가했습니다.

## 45. Update Log (2026-02-26)
- 출하시기 목록 화면(`app/(tabs)/market/index.tsx`)에서 섹션 타이틀을 직접 `Text` 렌더링에서 공통 `SectionLabel` 컴포넌트로 변경해 타이틀-카드 간격 기준을 홈/설정 화면과 통일했습니다.
- 같은 화면의 스크롤 컨테이너 상단 여백을 `pt-2`로 보정하고 카드 행 간격을 `mb-5`로 조정해 카드가 붙어 보이던 밀집감을 완화했습니다.

## 46. Update Log (2026-02-26)
- 설정 화면(`app/(tabs)/settings/index.tsx`)의 `계정전환` 라벨에서 `font-medium`을 제거해, 다른 메뉴 항목과 동일한 텍스트 굵기(`text-body`)로 통일했습니다.


## 2026-02-26 Update (UI)
- Added a pressable Search icon on the right side of the Market header and wired navigation to /market/search.
- Implemented a new Market Search screen with filter controls (Start Date, End Date, dropdown selector, and Search button).
- Implemented an Excel-like results table using horizontal ScrollView + vertical FlatList, with fixed-width columns and grid borders for priceDate, marketName, itemName, unitName, gradeName, and averagePrice.

## 2026-02-26 Update (UI - Market Search Sub Header)
- Replaced the Market Search page top header from TabHeader to the same custom sub-header pattern used in 고객센터 (left back chevron + title with bottom border).
- Back button now returns to market/index by navigation to /market while preserving existing DatePicker, Select, and Excel-like table layout.
## 2026-02-26 Update (UI - Search Filter Mapping)
- Updated Market Search dropdown to map options dynamically from /api/market/prices/recently and prepend default 전체 option.
- Dropdown option value now carries structured filter fields { itemCode, unit, grade } and uses them directly for search requests.
- DatePicker UI updated with display='spinner' while keeping Korean locale (ko-KR) and iOS confirm/cancel labels (확인/취소).

## 2026-02-26 Update (UI - Search 5 Fields + Validation)
- Refactored search filter UI into exactly five fields: 시작일, 종료일, 품목, 단위, 등급.
- Removed merged 품목/등급 selector and bound all five fields to the new global Zustand store.
- Added zod validation to disable 조회하기 button when any required field is empty or when 종료일 < 시작일.
- 조회하기 button now switches visual state with validation: invalid = bg-gray-400, valid = bg-black.


## 2026-02-26 Update (UI - DatePicker Replacement)
- components/ui/DatePicker.tsx를 react-native-modal-datetime-picker 래퍼에서 @react-native-community/datetimepicker 기반 커스텀 모달로 교체했습니다.
- DatePicker에 locale='ko-KR', display='spinner', themeVariant='light', textColor='black'를 적용하고, 하단 액션 버튼을 취소/확인으로 고정해 UI 일관성과 가독성을 개선했습니다.

## 2026-02-26 Update (UI - DatePicker Custom Korean Select)
- DatePicker를 연/월/일(또는 시/분) Select 조합 기반 커스텀 모달로 전환해 Android에서 발생하던 네이티브 Picker 겹침 이슈를 제거했습니다.
- DatePicker 컨테이너와 액션 버튼 라운드를 Select와 동일한 rounded-2xl 기준으로 통일했습니다.
- Picker 내부 라벨을 년/월/일(시/분) 한글 표기로 통일해 영어 월 약어 노출 문제를 제거했습니다.
## 2026-02-26 Update (UI - DatePicker Size Tuning)
- DatePicker 모달 폭/패딩/버튼 높이를 키워 전체 컨트롤 가시성을 확대했습니다.
- DatePicker 상단의 년/월/일 텍스트 라벨을 제거하고 선택 박스 자체만으로 조작하도록 단순화했습니다.
- DatePicker 내부 Select를 size='lg'로 적용해 입력 박스 높이와 텍스트 크기를 확대했습니다.
## 2026-02-26 Update (UI - Search Result Column Scope)
- 시세 검색 결과 테이블 컬럼을 요청 필드 기준으로 정리했습니다.
- 화면 출력 컬럼: `priceDate`, `itemName`, `gradeName`, `unitName`, `averagePrice`.
- `/recently` 기반 필터 옵션은 `전체(null)`를 포함해 품목/단위/등급 각각 분리 생성되도록 유지했습니다.
- 시세 검색 화면에 `검색 조건` 섹션 타이틀을 추가하고, `검색 결과`와 동일한 타이틀 스타일(`SectionLabel`)로 통일했습니다.
- 검색 결과 영역을 가로 스크롤 테이블에서 세로 리스트 레이아웃으로 변경했습니다.
- `전체` 선택값은 UI에서 sentinel(`__ALL__`)로 유지하고, Zustand 상태/API 요청 시 `null`로 변환되도록 처리했습니다.
- 시세 검색 필터 순서를 `품목 → 단위 → 등급 → 시작일 → 종료일`로 변경했습니다.
- Select, DatePicker 트리거, 조회하기 버튼의 높이를 `52px` 기준으로 통일하고 버튼 내부 좌우 패딩을 확장했습니다.
- 시세 검색 화면의 종료일 입력과 조회하기 버튼 사이 간격을 로그인 화면과 동일한 간격 기준(`mt-2`)으로 조정했습니다.
- 시세 검색의 조회하기 버튼 크기를 로그인 화면과 동일하게 `size='lg'` 기준으로 조정하고, 고정 높이 클래스(`h-[52px]`)를 제거했습니다.
- 시세 검색 화면에서 종료일 입력과 조회하기 버튼 사이 간격을 확장(`mt-4`)해 버튼 간격 답답함을 완화했습니다.
- 시세 검색 결과 리스트에 하단 스크롤 기반 페이지네이션(20개 단위 추가 로딩)을 적용했습니다.
- 시세 검색에서 `품목(itemCode)` 선택값에 따라 `무게(unit)` 드롭다운 옵션을 종속 필터링하도록 수정했습니다.
- 선택 품목에 존재하지 않는 무게가 선택되어 있으면 `전체(null)`로 자동 초기화되도록 보강했습니다.
- 시세 검색 조건 UI를 배지 요약 + 점진 노출 방식으로 변경했습니다.
- 상단에 품목/무게/등급/기간 배지를 한 줄로 표시하고, 기본 조건 카드는 축소해 초기 높이를 줄였습니다.
- 품목 선택 후 무게, 무게 선택 후 등급, 필요 시 날짜 입력이 보이도록 단계적으로 노출됩니다(상세 조건 토글 포함).
- 시세 검색 조건 UI에서 `상세 조건` 토글을 제거하고, 점진 노출만 유지하도록 단순화했습니다.
- 시세 검색 조건을 단계형 플로우로 재구성했습니다: 품목 → 무게 → 등급 → 날짜 → 조회하기.
- 완료된 단계만 배지로 누적 표시되고, 배지를 누르면 해당 단계로 돌아가 수정할 수 있습니다.
- 최종 단계(`done`)에서만 조회하기 버튼이 노출되도록 변경했습니다.
- 시세 검색 조건 배지에서 날짜 요약을 단일 배지에서 분리해 `시작일`, `종료일` 각각 독립 배지로 표시하도록 수정했습니다.
- 날짜 단계 UI를 순차 입력형으로 변경했습니다: `시작일` 입력 후 `다음`으로 `종료일` 입력 화면으로 이동.
- 시작일 선택 완료 시 종료일 단계로 자동 전환되며, 날짜 배지 클릭 시 다시 시작일 단계부터 수정할 수 있습니다.
- 검색 조건 배지 영역을 줄바꿈 레이아웃에서 가로 스크롤 1줄 레이아웃으로 변경해 시작일/종료일 배지가 겹치거나 잘리는 문제를 방지했습니다.

## 2026-02-26 Update (UI - 시세 검색 접근성/조작성 개선)
- 시세 검색 조건 배지 영역을 가로 스크롤 방식에서 줄바꿈(`flex-wrap`) 방식으로 변경해, 어르신 사용자 기준에서도 좌우 스와이프 없이 조건을 바로 확인할 수 있게 했습니다.
- 날짜 단계에서 중복 액션이던 `조건 적용` 버튼을 제거하고, 데이트피커 `확인`만으로 단계 완료되도록 단순화했습니다.
- 날짜 단계의 `다음` 버튼도 제거하여 조작 단계를 줄였고, 시작일 선택 후 종료일 단계 전환은 데이트피커 확인 시 자동으로 처리되도록 유지했습니다.
- DatePicker 모달 폭/패딩/버튼 간격을 검색 화면 카드 폭 기준에 맞춰 정리해 시각적 크기 불일치를 완화했습니다.
- 등급 선택 후 단계가 즉시 `조회하기`로 넘어가 데이트피커 진입이 어려운 흐름을 수정하고, 등급 선택 직후 `시작일` 입력 단계로 진입하도록 보정했습니다.
- 날짜 배지는 단계 진입만으로 표시되지 않도록 수정하고, 데이트피커 `확인` 이후에만 시작일/종료일 배지가 표시되도록 변경했습니다.
- DatePicker 상단 `날짜 선택`, 선택값 요약 텍스트를 제거하고, 버튼 높이를 입력 박스 기준(`52px`)으로 통일했습니다.
- 시세 검색 마지막 단계에서 `조회하기` 버튼을 조건 카드 내부가 아닌 카드 외부 단독 배치로 변경해 시각적 구조를 단순화했습니다.
- 검색 전에는 결과 카드를 노출하지 않고 안내 문구만 보여주도록 변경해 초기 화면의 빈 카드 노이즈를 줄였습니다.
- 검색 후 빈 결과 상태 카드 높이를 확대(`h-40`)해 메시지 가독성을 개선했습니다.
- 검색 전 `조회하기를 누르면 검색 결과가 표시됩니다.` 안내 문구를 제거하고, 검색 전에는 결과 영역을 완전히 비노출 처리했습니다.
- `검색 결과` 섹션 타이틀도 검색 실행 이후(`hasSearched=true`)에만 렌더링되도록 변경했습니다.
- 검색 조건 배지의 크기/터치 영역을 확대(`min-h-[44px]`, `px-4 py-2`, `text-body font-medium`)해 어르신 사용성(가독성/탭 정확도)을 개선했습니다.
- 시세 검색 결과 카드에서 메타 정보(품목 · 등급 · 단위)를 필터 선택 여부와 무관하게 항상 표시하도록 변경해, 날짜/가격만 보이던 정보 축소를 해소했습니다.
- 검색 조건 변경 시 자동 초기화 범위를 축소해, 사용자가 바꾼 항목만 변경되고 나머지 조건(무게/등급/기간)은 유지되도록 수정했습니다.
- 품목 변경으로 단위 옵션 목록이 달라질 때도 기존 선택값 배지가 즉시 사라지지 않도록, 현재 선택 단위를 옵션 리스트에 임시 포함해 선택 상태를 유지하도록 보정했습니다.
- 출하시기 상세(`[grade]`) 헤더 우측에 검색 버튼을 추가하고, `/market/search`로 이동 시 `itemCode/itemName/gradeName/unitName`를 전달하도록 연결했습니다.
- `[grade]`에서 진입한 검색 화면은 품목/무게/등급 배지가 자동 완성된 상태로 시작하고, 조건 수정은 시작일/종료일(DatePicker)만 가능하도록 단계를 날짜 입력으로 고정했습니다.
- `[grade]` 검색 버튼의 시각 스타일을 메인 `TabHeader` 우측 액션 버튼과 동일한 원형 버튼(`h-9 w-9`, border, card background)으로 통일했습니다.
- 고객센터 화면(`app/(tabs)/settings/customer/index.tsx`)의 섹션 여백을 `p-5`에서 제거(`px-5`, `px-5 mt-6`)해 설정 화면과 동일한 타이틀 간격으로 맞췄습니다.
- 고객센터 연락처/운영안내 우측 값 텍스트를 `text-subhead text-content-tertiary` 기준(다크 보조 텍스트 포함)으로 통일해 설정 화면과 동일한 크기/강도로 보정했습니다.
- 서브페이지 헤더 타이틀 스케일을 메인 탭 페이지와 통일했습니다: `text-title-1 font-bold` 기준으로 `고객센터`, `비교 분석`, `시세 검색`, `출하시기 상세`, `센서 상세`에 동일 적용했습니다.
- 서브페이지 스크롤 하단 여백을 메인 탭 기준(`pb-24`)으로 통일하고, 센서 상세의 좌우 컨텐츠 패딩을 `px-6`에서 `px-5`로 조정해 페이지 간 간격 체계를 맞췄습니다.
- 고객센터 연락처 카드의 행-디바이더 간격 답답함을 완화하기 위해 행 패딩을 `px-4 py-[18px]`로 확장하고, 디바이더를 인셋(`h-px mx-4`) 형태로 조정했습니다.
- 고객센터 카드 높이를 설정 메인 화면과 동일하게 맞추기 위해 연락처/이메일/운영안내 행 패딩을 `p-4` 기준으로 통일했습니다.

## 2026-02-26 Update (UI - Market Search Validation Feedback)
- 시세 검색 화면에서 Zod 검증 실패 시 조회하기 버튼 비활성화만 하지 않고, 버튼 아래에 검증 메시지를 즉시 노출하도록 변경했습니다.

## 2026-02-26 Update (UI - Start Date Immediate Validation)
- 시세 검색에서 시작일 선택 즉시 20230101 기준을 검증하도록 보강했습니다. 유효하지 않은 날짜(2023년 미만) 선택 시 즉시 에러를 노출하고, 시작일/종료일 배지는 확정되지 않도록 처리했습니다.

## 2026-02-26 Update (UI - Error Message Text Only)
- 로그인 및 시세 검색 화면의 에러 UI를 카드/배경 박스 형태에서 텍스트 전용 형태로 통일했습니다.

## 2026-03-01 Update (UI - 센서 임계치 입력 카드)
- 센서 상세 화면(`app/(tabs)/home/sensor/[id].tsx`)의 현재값 카드 아래에 `임계치 설정` 카드를 추가했습니다.
- 임계치 입력은 가로 2칸이 아닌 세로 2줄(최소값/최대값)로 배치해 CO2/광량처럼 4자리 이상 수치에서도 입력 텍스트가 깨지지 않도록 구성했습니다.
- 입력 필드는 센서 타입별 단위 표기(`℃`, `ppm`, `W/m²` 등)와 허용 범위 안내를 함께 표시하고, `최소값 < 최대값` 검증 실패 시 에러 메시지를 노출합니다.
- 저장 버튼(`임계치 저장`)을 추가해 사용자가 센서별 임계치를 명시적으로 확정할 수 있도록 했습니다.

## 2026-03-01 Update (UI - 센서 임계치 설정 모달 전환)
- 센서 상세 헤더 우측에 `lucide-react-native` 아이콘 버튼(설정 진입)을 추가하고, 버튼 탭 시 `임계치 설정` 모달이 열리도록 변경했습니다.
- 본문 카드형 임계치 UI는 제거하고, 모달 내부에서 최소값/최대값을 세로 입력 방식으로 구성했습니다.
- 사용자 자유 입력 정책에 맞춰 허용 범위 안내 문구와 범위 제한 검증을 제거했습니다. 현재는 `최소값이 최대값보다 큰 경우`만 에러 처리합니다.
- 모달 내 `저장` 버튼은 즉시 완료가 아니라 확인 모달을 띄우고, 확인 모달의 `취소/완료` 선택 후에 저장이 반영되도록 플로우를 변경했습니다.

## 2026-03-01 Update (UI - 센서 임계치 확인 UX 단순화)
- `모달 위 모달` 구조를 제거하고, 임계치 설정 모달 내부에서 `편집 화면 -> 저장 확인 화면`으로 전환되는 단일 모달 플로우로 변경했습니다.
- 저장 확인 단계는 동일 모달 내 `취소/완료` 버튼만 제공해 시각적 중첩과 포커스 분산을 줄였습니다.
- 최소값/최대값은 각각 선택 입력으로 유지하고, 둘 중 하나만 입력해도 저장 가능하도록 UX를 정리했습니다.
- 현재 설정 표시는 부분 입력 상태를 반영해 `최소/최대` 각각 `미설정` 표기까지 노출하도록 보강했습니다.
