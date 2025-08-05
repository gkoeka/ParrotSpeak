# Always Listening Architecture - Implementation Plan

## Overview
This document outlines the scaffolded architecture for implementing "Always Listening" mode in ParrotSpeak, enabling natural conversation flow without manual button tapping between speakers.

## Scaffolded Files

### 📁 `/services/`

#### `VoiceActivityService.ts`
**Purpose**: Low-level audio processing pipeline
- **Key Features**: Voice Activity Detection (VAD), silence detection, chunked audio output
- **Main Classes**: `VoiceActivityService`
- **Core Methods**: 
  - `startListening()` - Begin continuous audio capture
  - `processAudioChunk()` - Analyze audio for speech detection
  - `onSpeechDetected()` / `onSpeechEnded()` - Handle speech events
- **Configuration**: Silence thresholds, chunk sizes, noise filtering

#### `AlwaysListeningService.ts`
**Purpose**: High-level conversation orchestration
- **Key Features**: Speaker switching logic, turn-taking, conversation state machine
- **Main Classes**: `AlwaysListeningService`
- **State Machine**: 7 conversation states (idle, listening, processing, speaking)
- **Core Methods**:
  - `startAlwaysListening()` - Begin conversation flow
  - `detectLanguage()` - Auto-detect speaker language
  - `switchSpeaker()` - Manage speaker transitions
  - `manualSpeakerSwitch()` - Override for manual control

### 📁 `/contexts/`

#### `ConversationContext.tsx`
**Purpose**: Global state management for conversation flow
- **State Management**: React Context + useReducer pattern
- **Key State**: Always listening status, speaker info, microphone state, language detection
- **Actions**: 20+ actions for complete conversation control
- **Features**: Error handling, speaker tracking, UI state management

### 📁 `/components/`

#### `AlwaysListeningToggle.tsx` (New)
**Purpose**: UI toggle for always listening mode
- **Variants**: Switch, Button, Card layouts
- **Features**: Status indicators, theme support, error states
- **Integration**: Connected to ConversationContext
- **Accessibility**: Visual and text feedback

#### `VoiceInputControls.tsx` (Updated)
**Purpose**: Enhanced existing component with always listening integration
- **Added**: Always listening toggle integration
- **New Props**: `showAlwaysListeningToggle`, `onAlwaysListeningToggle`
- **Layout**: Seamless integration with existing voice controls

## Implementation Phases

### Phase 1: Foundation (Voice Activity Detection)
- ✅ Core service interfaces and types
- ⏳ Basic audio permissions and recording
- ⏳ Voice activity detection algorithm
- ⏳ Silence detection and timing

### Phase 2: Conversation Flow
- ⏳ Speaker switching logic
- ⏳ Language auto-detection
- ⏳ State machine implementation
- ⏳ Context integration with services

### Phase 3: Polish & Advanced Features
- ⏳ Manual override controls
- ⏳ Advanced UI indicators
- ⏳ Performance optimizations
- ⏳ Battery management

## Technical Specifications

### Audio Processing
- **Chunk Size**: 1-second audio segments
- **Silence Threshold**: -50dB default
- **Speaker Switch Timeout**: 2-3 seconds of silence
- **Language Detection**: OpenAI Whisper integration

### State Management
- **Pattern**: React Context + Reducer
- **Persistence**: AsyncStorage for preferences
- **Real-time**: WebSocket for conversation updates
- **Error Handling**: Comprehensive error boundaries

### UI/UX Design
- **Always Listening Toggle**: Multiple visual variants
- **Status Indicators**: Real-time conversation state
- **Speaker Visual**: Clear indication of active speaker
- **Manual Override**: Emergency controls always available

## Integration Points

### Existing Services
- **speechService.ts**: Audio recording and playback
- **languageService.ts**: Translation processing
- **AuthContext.tsx**: User authentication state
- **ThemeContext.tsx**: Dark/light mode support

### New Dependencies
- Voice Activity Detection library (TBD)
- Enhanced audio permissions
- Background processing capabilities
- Real-time audio analysis

## TypeScript Architecture

### Interfaces & Types
- `AudioChunk` - Processed audio segments
- `ConversationState` - State machine enum
- `SpeakerRole` - Source/Target speaker identification
- `VoiceActivityConfig` - Configurable parameters
- `ConversationUIState` - Complete UI state shape

### Error Handling
- Service-level error boundaries
- Context error state management
- User-friendly error messages
- Graceful degradation to manual mode

## Next Steps

1. **Phase 1 Implementation**: Begin with VoiceActivityService core functionality
2. **Permissions Setup**: Configure microphone permissions for continuous use
3. **Audio Pipeline**: Implement VAD algorithm and silence detection
4. **Testing Framework**: Create test scenarios for conversation flow
5. **Performance Monitoring**: Integrate with existing performance tracking

## File Status
- ✅ All files scaffolded with comprehensive documentation
- ✅ TypeScript interfaces and types defined
- ✅ JSDoc annotations for all public methods
- ✅ TODO markers for implementation phases
- ✅ Integration points identified with existing codebase
- ✅ No TypeScript compilation errors

## Repository Status
- **Branch**: `backup-before-always-listening`
- **Base**: Current with main branch (3-day preview system included)
- **Ready**: For Phase 1 implementation to begin