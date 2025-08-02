# ParrotSpeak E2E Tests with Detox

This directory contains end-to-end tests for ParrotSpeak using Detox.

## Prerequisites

1. **Install Detox CLI**:
   ```bash
   npm install -g detox-cli
   ```

2. **Install dependencies**:
   ```bash
   npm install --save-dev detox jest-circus
   ```

3. **iOS Setup** (macOS only):
   - Install Xcode from App Store
   - Install iOS Simulator:
     ```bash
     xcode-select --install
     ```
   - Install applesimutils:
     ```bash
     brew tap wix/brew
     brew install applesimutils
     ```

4. **Android Setup**:
   - Install Android Studio
   - Create an AVD (Android Virtual Device) named "Pixel_3a_API_34"
   - Ensure `ANDROID_HOME` environment variable is set

## Running Tests

### iOS Simulator
```bash
# Build the app
detox build -c ios.sim.debug

# Run tests
detox test -c ios.sim.debug
```

### Android Emulator
```bash
# Build the app
detox build -c android.emu.debug

# Run tests
detox test -c android.emu.debug
```

### Specific Test
```bash
# Run only the translation tests
detox test -c ios.sim.debug e2e/translation.test.js
```

## Test Structure

- **translation.test.js**: Tests for language selection and text translation
  - Selecting English and Spanish languages
  - Submitting text for translation
  - Verifying translation results
  - Language pair switching
  - Error handling for unsupported languages

- **helpers.js**: Reusable test helper functions
  - Language selection
  - Text input
  - Element waiting
  - Login functionality

## Adding Test IDs to Components

For Detox to interact with UI elements, you need to add `testID` props to your React Native components:

```typescript
// Example in LanguageSelectorMobile.tsx
<TouchableOpacity
  testID="source-language-selector"
  onPress={openSourceLanguageModal}
>
  <Text>{sourceLanguage.name}</Text>
</TouchableOpacity>
```

## Common Test IDs Used

- `conversation-screen`: Main conversation screen
- `source-language-selector`: Source language selector button
- `target-language-selector`: Target language selector button
- `language-selector-modal`: Language selection modal
- `language-search-input`: Search input in language modal
- `language-option-{code}`: Individual language options (e.g., `language-option-en`)
- `text-input-field`: Text input field for translation
- `translate-button`: Button to submit translation
- `translation-result`: Container for translation results
- `swap-languages-button`: Button to swap source/target languages

## Debugging

1. **Enable synchronization debugging**:
   ```javascript
   await device.setURLBlacklist(['.*']);
   ```

2. **Take screenshots**:
   ```javascript
   await device.takeScreenshot('test-name');
   ```

3. **View device logs**:
   ```bash
   detox test --loglevel trace
   ```

## CI/CD Integration

To run Detox tests in CI:

```yaml
# Example GitHub Actions workflow
- name: Install Detox dependencies
  run: |
    npm install -g detox-cli
    brew tap wix/brew
    brew install applesimutils

- name: Build iOS app
  run: detox build -c ios.sim.release

- name: Run iOS tests
  run: detox test -c ios.sim.release --cleanup
```