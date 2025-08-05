// Test helper functions for Detox tests

/**
 * Wait for an element to be visible with a custom timeout
 * @param {Detox.NativeMatcher} matcher - The element matcher
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForElement(matcher, timeout = 10000) {
  await waitFor(matcher).toBeVisible().withTimeout(timeout);
}

/**
 * Type text into an input field
 * @param {string} testID - The testID of the input field
 * @param {string} text - The text to type
 */
export async function typeIntoInput(testID, text) {
  await element(by.id(testID)).clearText();
  await element(by.id(testID)).typeText(text);
}

/**
 * Tap on an element
 * @param {string} testID - The testID of the element to tap
 */
export async function tapElement(testID) {
  await element(by.id(testID)).tap();
}

/**
 * Select a language from the language selector
 * @param {string} languageCode - The language code (e.g., 'en', 'es')
 * @param {string} selectorType - 'source' or 'target' language selector
 */
export async function selectLanguage(languageCode, selectorType = 'source') {
  const selectorTestId = selectorType === 'source' ? 'source-language-selector' : 'target-language-selector';
  
  // Tap the language selector to open modal
  await tapElement(selectorTestId);
  
  // Wait for language modal to appear
  await waitForElement(by.id('language-selector-modal'));
  
  // Scroll to and tap the desired language
  await element(by.id('language-list')).scrollTo('bottom');
  await element(by.id(`language-option-${languageCode}`)).tap();
}

/**
 * Wait for translation to complete
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForTranslation(timeout = 5000) {
  await waitFor(element(by.id('translation-result')))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Get the text content of an element
 * @param {string} testID - The testID of the element
 * @returns {Promise<string>} The text content
 */
export async function getElementText(testID) {
  const attributes = await element(by.id(testID)).getAttributes();
  return attributes.text || attributes.label || '';
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>} True if logged in, false otherwise
 */
export async function isLoggedIn() {
  try {
    await waitFor(element(by.id('conversation-screen')))
      .toBeVisible()
      .withTimeout(2000);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Login with test credentials
 * @param {string} email - Test user email
 * @param {string} password - Test user password
 */
export async function loginTestUser(email = 'test@parrotspeak.com', password = 'TestPassword123!') {
  // Check if already logged in
  if (await isLoggedIn()) {
    return;
  }
  
  // Navigate to login screen
  await element(by.id('auth-screen-login-button')).tap();
  
  // Enter credentials
  await typeIntoInput('email-input', email);
  await typeIntoInput('password-input', password);
  
  // Submit login
  await tapElement('login-submit-button');
  
  // Wait for navigation to conversation screen
  await waitForElement(by.id('conversation-screen'), 15000);
}