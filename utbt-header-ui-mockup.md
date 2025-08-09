# UTBT Header UI Mockup

```
┌─────────────────────────────────────────┐
│ 🏠 ParrotSpeak                     ⚙️  │ <- Main Header
├─────────────────────────────────────────┤
│ ┌──────┐  →  ┌──────┐  ┌───────┐      │ <- UTBT Header
│ │ A: en │     │ B: es │  │ ⇄ Swap│      │
│ └──────┘     └──────┘  └───────┘      │
│                                         │
│ Auto-detect speakers            [ON ▣] │
└─────────────────────────────────────────┘
│                                         │
│ [English (US)] ⇄ [Spanish (Spain)]     │ <- Existing LanguageSelector
│                                         │
│         < Conversation Area >           │
│                                         │
```

## Component Features:

### Speaker Chips
- **Compact design**: Shows "A: en" and "B: es" format
- **Tappable**: Opens language picker modal
- **Visual flow**: Arrow icon between chips shows direction

### Language Picker Modal
```
┌─────────────────────────────────┐
│ Select Language for Speaker A   │
├─────────────────────────────────┤
│ 🇺🇸 English (en)                │
│ 🇪🇸 Spanish (es)                │
│ 🇫🇷 French (fr)                 │
│ 🇩🇪 German (de)                 │
│ 🇮🇹 Italian (it)                │
│ 🇵🇹 Portuguese (pt)             │
│ ...                              │
├─────────────────────────────────┤
│        [ Cancel ]                │
└─────────────────────────────────┘
```

### Swap Button
- **Blue background** with white swap icon (⇄)
- **Toast notification**: "Direction swapped" on tap

### Auto-detect Toggle
- **Label**: "Auto-detect speakers"
- **Switch**: Standard iOS/Android toggle
- **Default**: ON for automatic language detection

## Dark Mode Support
- Light mode: Gray background (#f8f9fa), white chips
- Dark mode: Dark background (#1a1a1a), dark chips (#2a2a2a)