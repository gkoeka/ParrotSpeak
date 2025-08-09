# UTBTHeader Caption Update - Visual Mock

## Before (No caption text)
```
┌─────────────────────────────────────────┐
│  [A: en] → [B: es]  [Swap]              │
│  Auto-detect speakers         [●]       │
└─────────────────────────────────────────┘
```

## After - Auto-detect ON
```
┌─────────────────────────────────────────┐
│  [A: en] → [B: es]  [Swap]              │
│  Auto-detect speakers         [●]       │
│  Auto: routes by spoken language        │ ← New caption (italic, gray)
└─────────────────────────────────────────┘
```

## After - Auto-detect OFF
```
┌─────────────────────────────────────────┐
│  [A: en] → [B: es]  [Swap]              │
│  Auto-detect speakers         [○]       │
│  Manual: A → B (use Swap)               │ ← New caption (italic, gray)
└─────────────────────────────────────────┘
```

## Style Details
- Caption font: 11px, italic
- Light mode: color #999
- Dark mode: color #666  
- Position: 2px below toggle row

## Accessibility Labels
- When ON: "Auto-detect enabled: routes by spoken language"
- When OFF: "Auto-detect disabled: manual A to B routing"
