# 작업 방식 통합 가이드

기준일: 2026-02-24

## 1. 목적
- 컨텍스트가 길어져도 작업 규칙을 잊지 않도록, 모든 AI 작업의 공통 기준을 문서로 고정한다.

## 2. 작업 시작 규칙
- 작업 시작 전에 아래 문서를 먼저 읽는다.
  - `C:/Users/User/gcamp-2026-test-app/.agents/skills/vercel-react-native-skills/SKILL.md`
  - `docs` 폴더 내 최신 `.md` 문서
- 읽은 기준으로 작업하고, 작업 결과/변경 사항을 `docs`의 md 파일에 반드시 기록한다.

## 3. 스타일링 규칙
- 기본 UI 스타일링은 `tailwindcss` + `className` 방식으로 구현한다.
- `AOS(Android)`에서 `className` 또는 Tailwind로 직접 적용이 어려운 스타일은 `StyleSheet`로 분리해 구현한다.
- 우선순위:
  1. `className`으로 해결
  2. 불가한 항목만 `StyleSheet`로 보완

## 4. React Compiler 기준
- React Compiler 사용을 전제로 작성한다.
- `useMemo`, `useCallback`은 기본적으로 사용하지 않는다.
- 아래 조건에서만 예외적으로 사용한다.
  - 실제 성능 병목이 확인된 경우
  - 외부 라이브러리/의존성 요구로 참조 안정성이 반드시 필요한 경우
  - 사용 시 근거(왜 필요한지)를 코드 또는 문서에 짧게 남긴다.

## 5. 문서화 규칙
- 기능 작업 후 아래 중 최소 1개 이상을 갱신한다.
  - 아키텍처 변경: `docs/01-architecture-definition.md`
  - API 변경: `docs/02-api-definition.md`
  - UI/디자인 변경: `docs/03-design-definition.md`
- 공통 작업 원칙 변경 시 이 문서(`docs/00-workflow-guidelines.md`)를 우선 갱신한다.

## 6. 체크리스트
- [ ] SKILL.md 확인
- [ ] docs 기존 문서 확인
- [ ] 구현 시 className 우선 적용
- [ ] AOS 비적용 스타일은 StyleSheet로 분리
- [ ] 불필요한 useMemo/useCallback 미사용
- [ ] 작업 후 docs 반영

## 7. Update Log (2026-02-24)
- Temporary debug logging was added for camera RTSP address hydration flow.
- Added tags: `[auth][normalize]`, `[auth][login]`, `[auth][bootstrap]`, `[app][bootstrap]`, `[camera][hydrate]`.
