# Constants

앱 전역 상수 및 디자인 토큰입니다.

## 진입점

- **`index.ts`** – 한 곳에서 re-export. `import { Colors, Spacing } from '@/constants'` 가능.
- **`design.ts`** – G-CAMP 디자인 시스템 (Colors, Spacing, Radius, Font, Shadow). `ThemeContext`와 탭/카드 등에서 사용.
- **`theme.ts`** – 레거시 테마 (Colors, Fonts). `ThemedText` / `ThemedView` / `useThemeColor`에서 사용.

새 스타일/색/간격은 `design.ts`에 추가하고, 앱 코드에서는 `@/constants` 또는 `@/constants/design`에서 import하는 것을 권장합니다.
