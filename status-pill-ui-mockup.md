# Status Pill UI Mockup

## Visual Representation

### During Pipeline Processing:
```
┌─────────────────────────────────────────┐
│ 🏠 ParrotSpeak                     ⚙️  │
├─────────────────────────────────────────┤
│ [A: en] → [B: es] [⇄ Swap]             │
│ Auto-detect speakers           [ON ▣]   │
├─────────────────────────────────────────┤
│      ┌─────────────────────────┐       │
│      │ ⟳ Transcribing...       │       │ <- Status Pill
│      └─────────────────────────┘       │
├─────────────────────────────────────────┤
│ [English (US)] ⇄ [Spanish (Spain)]     │
└─────────────────────────────────────────┘
```

### When Idle (No Pill Shown):
```
┌─────────────────────────────────────────┐
│ 🏠 ParrotSpeak                     ⚙️  │
├─────────────────────────────────────────┤
│ [A: en] → [B: es] [⇄ Swap]             │
│ Auto-detect speakers           [ON ▣]   │
├─────────────────────────────────────────┤
│ [English (US)] ⇄ [Spanish (Spain)]     │
└─────────────────────────────────────────┘
```

## Status Progression

### 1. Uploading
```
┌─────────────────────────┐
│ ⟳ Uploading audio...    │
└─────────────────────────┘
```

### 2. Transcribing
```
┌─────────────────────────┐
│ ⟳ Transcribing...       │
└─────────────────────────┘
```

### 3. Translating
```
┌─────────────────────────┐
│ ⟳ Translating...        │
└─────────────────────────┘
```

### 4. Preparing Audio
```
┌─────────────────────────┐
│ ⟳ Preparing audio...    │
└─────────────────────────┘
```

### 5. Error State
```
┌──────────────────────────────┐
│ ⚠️ Error occurred            │ <- Red background
└──────────────────────────────┘
```

## Design Details

- **Position**: Centered below UTBTHeader
- **Background**: Light blue (#f0f4ff) / Dark mode (#1e3a5f)
- **Text Color**: Blue (#007AFF) / Dark mode (#5c8cff)
- **Error Color**: Red background (#ffe0e0) with red text (#dc3545)
- **Animation**: Small activity spinner on left side
- **Padding**: 8px vertical, 16px horizontal
- **Border Radius**: 20px (pill shape)
- **Visibility**: Only shown during processing, hidden when idle