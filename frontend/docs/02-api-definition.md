# 📡 API 명세서 및 연동 아키텍처

최종 수정일: 2026-02-25
주요 파일: `services/api/contracts.ts`, `services/api/features/*`

## 1. 기본 설정 및 네트워크 정책

- **Base URL:** `EXPO_PUBLIC_API_BASE_URL` (환경 변수 적용)
- **HTTP 클라이언트:** Axios 기반 설정 (`timeout: 10000ms`, 대용량/파일 API는 30000ms 적용)
- **인증 헤더:** `Authorization: Bearer <accessToken>`
- **인증 처리 로직:**
  - `feature !== 'auth'` (인증 API 제외)인 경우 모든 요청에 인증 헤더 자동 포함.
  - API 응답은 공통 래퍼 유틸리티(`unwrapResult`)를 통해 파싱 및 일관성 확보.
  - 401 Unauthorized 에러 발생 시 `/auth/refresh-token` API를 호출하여 토큰 갱신 후 1회 자동 재시도.

## 2. Feature별 API 엔드포인트 명세서

| Feature     | Method | Path                                       | 인증 필요 | 설명                                  |
| :---------- | :----- | :----------------------------------------- | :-------: | :------------------------------------ |
| **auth**    | POST   | `/auth/authenticate`                       |     N     | 사용자 로그인 (토큰 발급)             |
| **auth**    | POST   | `/auth/refresh-token`                      |     N     | Access Token 만료 시 갱신             |
| **farm**    | GET    | `/farm/me`                                 |     Y     | 사용자 및 내 농장 프로필 정보 조회    |
| **weather** | GET    | `/weather`                                 |     Y     | 현재 날씨 및 예보 조회 (lat/lon 기반) |
| **network** | GET    | `/network/public-ip`                       |     Y     | 현재 접속된 퍼블릭 IP 조회            |
| **sensor**  | GET    | `/sensor/summary`                          |     Y     | 등록된 센서 요약 데이터 조회          |
| **sensor**  | GET    | `/sensor/recent`                           |     Y     | 센서 최신(실시간) 측정 데이터 조회    |
| **market**  | GET    | `/market/prices`                           |     Y     | 도매 시장 가격 데이터 조회            |
| **market**  | GET    | `/market/prices/recently`                  |     Y     | 최근 시장 가격 추이 (차트용)          |
| **market**  | GET    | `/market/prices/settlements`               |     Y     | 특정 기간/조건의 경매 정산 가격       |
| **market**  | POST   | `/market/prices/settlements/save`          |     Y     | 경매 정산 가격 데이터 저장/수정       |
| **market**  | GET    | `/market/prices/average`                   |     Y     | 연도별/작물별 시장 평균 가격 조회     |
| **market**  | GET    | `/market/prices/db/avg-week`               |     Y     | 주간 평균 가격 데이터베이스 조회      |
| **market**  | GET    | `/market/prices/db/avg-range`              |     Y     | 특정 기간 범위 평균 가격 조회         |
| **market**  | GET    | `/market/meta/markets`                     |     Y     | 도매 시장 메타 정보 (목록) 조회       |
| **market**  | GET    | `/market/meta/items`                       |     Y     | 품목/작물 메타 정보 조회              |
| **admin**   | GET    | `/admin/sensor`                            |     Y     | [관리자] 전체 센서 목록 조회          |
| **admin**   | POST   | `/admin/sensor`                            |     Y     | [관리자] 신규 센서 등록               |
| **admin**   | PATCH  | `/admin/sensor`                            |     Y     | [관리자] 센서 정보 수정               |
| **admin**   | GET    | `/admin/sensor/{code}`                     |     Y     | [관리자] 특정 센서 상세 정보          |
| **admin**   | GET    | `/admin/sensorkit`                         |     Y     | [관리자] 센서 키트 목록 조회          |
| **admin**   | GET    | `/admin/sensorkit/{code}`                  |     Y     | [관리자] 센서 키트 상세 정보          |
| **admin**   | POST   | `/admin/farm`                              |     Y     | [관리자] 신규 농장 등록               |
| **admin**   | POST   | `/admin/account/register`                  |     Y     | [관리자] 관리자 계정 생성             |
| **admin**   | GET    | `/admin/account`                           |     Y     | [관리자] 사용자 계정 목록 조회        |
| **admin**   | PATCH  | `/admin/account`                           |     Y     | [관리자] 사용자 계정 정보 수정        |
| **admin**   | GET    | `/admin/account/{username}`                |     Y     | [관리자] 사용자 계정 상세 정보        |
| **admin**   | PATCH  | `/admin/account/reset-password/{username}` |     Y     | [관리자] 사용자 비밀번호 강제 초기화  |
| **admin**   | GET    | `/admin/good`                              |     Y     | [관리자] 품목 카테고리 및 등급 조회   |

## 3. 주요 Request / Response DTO

- **인증 (Auth):**
  - `AuthenticationReq`(인증 요청): `username`, `password`, `termsAccepted?`, `privacyAccepted?`, `policiesAccepted?`
- **날씨 (Weather):**
  - `WeatherRequestDto`(날씨 요청): `lat`, `lon`, `exclude?`
- **센서 (Sensor):**
  - `SensorTypeSummaryReq`(센서 요약 요청): `sensorType?`, `type?`, `showType?`
- **시장 (Market):**
  - `SettlementAverageQuery`(정산 평균 조회): `itemCode`, `grade`, `unitName`
  - `MarketRequestDto`: 조건/등급/단위/시장/기간 등 검색 필터 객체

## 4. 응답 데이터 파싱 및 안전성 확보 (Safety)

- 응답 데이터는 방어적 프로그래밍을 위해 `Record<string, unknown>` 타입으로 1차 파싱합니다.
- 불필요한 래핑 객체를 벗겨내고 실제 페이로드인 `data/result` 내부 값만 추출하여 사용합니다.
- 향후 안정성 강화를 위해 `zod` 라이브러리를 활용한 런타임 스키마 검증(Validator) 도입을 고려합니다.

## 5. 전역 에러 핸들링 (Error Handling)

- Axios Interceptor를 통해 에러 메시지를 추출하며, 다음 우선순위를 따릅니다:
  1. `response.data.message` (서버에서 내려주는 명시적 에러 메시지)
  2. 원본(raw) string body
  3. Timeout 또는 500 등 네트워크 단절 기본 에러 메시지
- 토큰 갱신(Refresh) 실패 시 즉시 에러를 throw하고 유저를 강제 로그아웃 시켜 로그인 화면으로 돌려보냅니다.

## 6. 로컬 스토리지 보관 데이터 (SecureStore)

- 앱 내에 안전하게 보관되는 사용자 세션 데이터:
  - 접근/갱신 토큰: `access/refresh token`
  - 사용자 기본 정보: `username`, `name`, `role`
  - 농장 위치 정보: `farmAddress`, `farmLatitude`, `farmLongitude`
  - `ipcamAddress`, `mac` (카메라 및 네트워크 연동 정보)

---

## 📅 업데이트 로그 (2026-02-24 ~ 2026-02-25)

**[2026-02-24] 데이터 파싱 및 UI 연동 수정**

- `AuthenticationRes` 응답에서 `farms[].ipcam_address`를 파싱하여 낙타 표기법인 `ipcamAddress`로 통합 처리.
- 서버 응답에 따라 섞여서 들어오는 `ipcam_address`, `ipcamAddress`, `rtsp`, `rtspUrl` 키워드들을 방어적으로 추출하도록 로직 보강.
- 날씨 API 강수확률(`pop`) 데이터가 소수점(예: 0.3)으로 내려오는 것을 백분율(30%) 정수형으로 변환하여 UI에 렌더링하도록 수정.
- 사용자의 휴대전화 번호(`phone`)를 SecureStore 및 Zustand 상태(Hydrate)에 동기화.
- 로컬 웹서버 또는 비인가 API 연동 테스트를 위해 Android 환경의 `usesCleartextTraffic="true"` (HTTP 평문 통신 허용) 옵션 활성화.

**[2026-02-25] CamHiPro 카메라 PTZ 제어 기능 통합**

- CamHiPro 계열 카메라의 제어 요청을 `http://<ip>:<port>/cgi-bin/hi3510/*` 경로로 통일.
- **방향 제어:** `/cgi-bin/hi3510/ptzctrl.cgi?-step=0&-act={up|down|left|right|stop}&-speed=45`
- **줌 제어:** `/cgi-bin/hi3510/ptzzoomin.cgi`, `/cgi-bin/hi3510/ptzzoomout.cgi`
- 줌 정지 시 발생하는 예외 대응을 위해, 줌 정지 요청도 방향키 정지와 동일한 `ptzctrl.cgi?-step=0&-act=stop`으로 Fallback 처리 완료.
- 영상 RTSP URL 문자열에서 계정과 비밀번호를 정규식으로 추출해 HTTP Basic Auth 헤더로 안전하게 주입하도록 구현.

**[2026-02-25] 로그인 및 사용자 정보 동기화 로직 분리**

- `/auth/authenticate` 엔드포인트는 로그인 성공 시 **토큰 발급** 역할만 수행하도록 로직 전면 개편.
- 로그인 성공 직후 `GET /farm/me` API를 연계 호출하여 `username, name, phone, address, latitude, longitude, ipcamAddress, mac` 정보를 불러온 뒤 전역 상태에 Hydrate 하도록 수정.
- `services/api/features/farm/service.ts` 내부에 데이터 정규화 함수(`normalizeMyFarmProfile`)를 추가하여 파싱 진입점을 통일.


## 2026-02-26 업데이트 (API)
- `services/api/features/market/service.ts`에 전용 조회 함수 `searchMarketPrices(params)`를 추가해 시세 검색 API를 연동했습니다.
- 사용 엔드포인트: `http://34.64.246.19:7060/api/market/prices/search`
- 지원 쿼리 파라미터: `startDate`, `endDate`, `page`(기본값 1), `count`(기본값 20)
- `types/api/features/market.ts`에 검색 API 요청/응답 타입(`MarketSearchRequest`, `MarketSearchRecord`, `MarketSearchResponse`)을 추가했습니다.

## 2026-02-26 업데이트 (API - 검색 파라미터)
- 시세 검색 요청 파라미터를 `startDate`, `endDate`, `page`, `count`와 함께 `itemCode`, `grade`, `unit`을 항상 포함하도록 확장했습니다.
- `searchMarketPrices` 호출이 `/api/market/prices/search`로 필수 쿼리 파라미터를 모두 전달하도록 수정했습니다.

## 2026-02-26 업데이트 (API - 검색 검증 결합)
- 시세 검색 요청이 Zustand 검색 상태를 기반으로 동작하도록 변경하고, `startDate`, `endDate`, `itemCode`, `grade`, `unit`, `page`, `count`를 모두 포함하도록 정리했습니다.
- 검색 화면에서 zod 사전 검증을 추가해 유효하지 않은 요청은 API 실행 전에 차단하도록 했습니다.

## 2026-02-26 업데이트 (API - 페이지네이션 기본값 고정)
- searchMarketPrices 호출에서 page와 count를 서비스 레이어에서 고정값 1, 20으로 강제해 항상 동일한 페이징 파라미터가 전송되도록 수정했습니다.
## 2026-02-26 업데이트 (API - 시세 검색 디버그 로깅)
- `searchMarketPrices` 서비스에 요청/응답 디버그 로그를 추가했습니다.
- 요청 로그에 `startDate`, `endDate`, `itemCode`, `grade`, `unit`, `page`, `count`를 출력합니다.
- 응답 로그에 `totalElements`, `totalPages`, `recordsLength`, `sampleRecord`를 출력합니다.
- 검색 응답 타입에 `MarketSearchResult` 메타 필드(`itemCode`, `grade`, `unit`, `startDate`, `endDate`, `page`, `count`, `size`, `totalElements`, `totalPages`)를 추가했습니다.
- 검색 API 호출을 `raw axios`에서 `callApi` 경유로 전환하여 `Authorization` 헤더/토큰 재시도 체인과 동일하게 동작하도록 정렬했습니다.

## 2026-02-27 업데이트 (API - Base URL 환경 변수 폴백)
- API Base URL 해석 시 EXPO_PUBLIC_API_URL 우선, 미설정 시 EXPO_PUBLIC_API_BASE_URL를 fallback으로 허용하도록 보강했습니다.

## 2026-02-27 업데이트 (API - 하드코딩 Base URL 제거)
- services/api/core/config.ts에서 DEFAULT_API_BASE_URL 하드코딩 fallback을 제거했습니다.
- 이제 API Base URL은 EXPO_PUBLIC_API_URL 또는 EXPO_PUBLIC_API_BASE_URL env가 없으면 fail-fast 에러를 발생시킵니다.
## 2026-02-27 업데이트 (API - EAS 프로덕션 환경 변수)
- `eas.json`의 `build.production.env`에 `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_PROJECT_ID`를 추가해 AAB 프로덕션 빌드에서도 런타임 API 환경변수가 누락되지 않도록 정리했습니다.

## 2026-02-27 업데이트 (API - Refresh Token 경쟁 상태 수정)
- `services/api/core/callApi.ts`에 refresh token 재발급 single-flight 로직을 추가해 동시 401 상황에서도 refresh 요청이 1회만 수행되도록 수정했습니다.
- refresh 응답이 401/403일 경우 세션을 즉시 정리하도록 처리해, 만료 세션이 남아서 빈 데이터 화면으로 진입하는 문제를 방지했습니다.

## 2026-03-01 업데이트 (API - 만료된 Refresh Token 즉시 실패 처리)
- refresh 응답에서 access token을 복구하지 못한 경우에도 세션을 즉시 정리하도록 `callApi`를 보강했습니다.
- 인증 요청이 401로 실패하고 refresh 재발급이 실패하면 세션을 강제 정리해, 이후 탭 레이아웃 가드가 로그인 화면으로 즉시 전환할 수 있도록 동작을 일원화했습니다.
