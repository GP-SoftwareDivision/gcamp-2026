# 공통 스타일 시트

Tailwind(NativeWind)로 커버되지 않는 플랫폼별 스타일을 중앙 관리합니다.

## cardStyles

- **getCardBaseStyle(isDark)** – 카드 쉐도우·보더 (Android elevation 포함)
- **getCardPadding()** – Android 카드 내부 패딩 (iOS는 Tailwind `p-5` 사용)
- **sectionStyles** – 섹션·헤더·갭 등 레이아웃 상수

## 사용

```ts
import { getCardBaseStyle, getCardPadding, sectionStyles } from '@/styles/cardStyles'
```

## 컴포넌트

- **Card** – 공통 컨테이너 카드 (`getCardBaseStyle` 사용)
- **DataCard** – 점 + 라벨 + 값 패턴 (나의 농장·시세 카드) – `getCardBaseStyle`, `getCardPadding` 사용
