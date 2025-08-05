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

### Phase 1: Foundation (Voice Activity Detection) ✅ COMPLETE
- ✅ Core service interfaces and types
- ✅ Basic audio permissions and recording
- ✅ Voice activity detection algorithm
- ✅ Silence detection and timing
- ✅ Audio chunk extraction with metadata
- ✅ File system management for audio chunks

### Phase 2: Conversation Flow ✅ COMPLETE
- ✅ Speaker switching logic with configurable thresholds
- ✅ Language auto-detection via Whisper API
- ✅ State machine implementation (7 states)
- ✅ Context integration with services
- ✅ Automatic speaker role management
- ✅ Conversation turn tracking

### Phase 3: Polish & Advanced Features ✅ COMPLETE
- ✅ Manual override controls for speaker switching
- ✅ Advanced UI indicators with real-time state display
- ✅ Performance optimizations (queue management, caching)
- ✅ Battery management through efficient audio processing
- ✅ Enhanced error handling and recovery
- ✅ Comprehensive logging for QA testing

## Recent Optimizations (February 8, 2025)

### Audio File Management
- **Automatic Cleanup**: Temporary audio files are automatically deleted after 30 seconds
- **File Validation**: Added existence checks before processing to prevent "file not found" errors
- **Size Validation**: Audio chunks are validated for reasonable size before Whisper API submission

### Error Handling Improvements
- **Categorized Error Logging**: Different error types are logged with specific prefixes:
  - `Missing mic input`: OpenAI API key issues
  - `Whisper API failure`: API communication errors
  - `Audio file issues`: File system problems
  - `Translation API timeout`: Translation service delays
  - `TTS errors`: Text-to-speech failures
- **Graceful Fallbacks**: Translation errors return "(Translation unavailable)" instead of crashing
- **Automatic Recovery**: System attempts to recover from errors by switching speakers after 2-second delay

### Performance Enhancements
- **Queue Management**: 
  - Duplicate chunk prevention using timestamp-based IDs
  - Maximum queue size limit (10 chunks) to prevent memory issues
  - Processing state tracking for better resource management
- **Speech Synthesis Safety**:
  - Cancel any pending speech before playing new audio
  - Prevents overlapping audio playback
  - Better error handling for TTS failures
- **Translation Caching**: Implemented caching for repeated translations
- **Performance Monitoring**: Added timing logs for all major operations

### Enhanced Logging
- **State Transitions**: Clear logging with arrow notation (e.g., `State change → PROCESSING_SOURCE`)
- **Data Flow Visibility**: Truncated logs for transcriptions/translations to avoid console spam
- **Queue Status**: Real-time queue size reporting
- **File Operations**: Detailed logging for audio file creation, processing, and cleanup

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

## Phase 3 Implementation (Complete - Aug 5, 2025)

### Implemented Features

1. **Real Audio Extraction**:
   - VoiceActivityService now extracts real audio files from recordings
   - Automatic recording restart after chunk extraction
   - File URIs provided for downstream processing

2. **Whisper API Integration**:
   - SpeechService class created with full Whisper integration
   - Multipart form data upload for audio files
   - Language detection with confidence scoring
   - Verbose JSON response for detailed analysis

3. **Translation Pipeline**:
   - Integration with existing translation service
   - Translation caching for common phrases
   - Performance monitoring for all operations
   - Error handling for API failures

4. **Speech Synthesis**:
   - expo-speech integration for TTS
   - Language-specific voice selection
   - Completion callbacks for flow control
   - Error recovery continues conversation

5. **Enhanced Error Handling**:
   - Specific error types for different scenarios
   - API key management with user prompts
   - Audio file validation
   - Graceful recovery strategies

### Key Files Modified

- `services/VoiceActivityService.ts`: Real audio extraction
- `services/AlwaysListeningService.ts`: AI pipeline integration
- `services/speechService.ts`: New service for Whisper/translation
- `contexts/ConversationContext.tsx`: New state properties and callbacks

### Testing Requirements

**On-Device Testing Needed**:
- Real microphone input quality
- Actual Whisper API response times
- Network latency impact
- Speech synthesis quality
- Battery usage monitoring

**Mocked Testing Available**:
- Test script created: `test-phase3-always-listening.js`
- Validates flow without real API calls
- Confirms proper error handling
- Verifies state transitions

### Next Steps (Phase 4)

1. **UI Updates**:
   - Display transcription/translation in real-time
   - Visual processing indicators
   - Conversation history display

2. **Performance Optimization**:
   - Optimize chunk sizes for API calls
   - Implement request queuing
   - Add retry logic for failures

3. **Advanced Features**:
   - Multi-party conversation support
   - Better language detection UI
   - Conversation export functionality