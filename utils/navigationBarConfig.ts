import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export async function configureNavigationBar(isDarkMode: boolean) {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    // Set background color
    const bgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
    await NavigationBar.setBackgroundColorAsync(bgColor);
    console.log('[NavBar] Set background color to:', bgColor);
    
    // Set button style (dark buttons on light bg, light buttons on dark bg)
    const buttonStyle = isDarkMode ? 'light' : 'dark';
    await NavigationBar.setButtonStyleAsync(buttonStyle);
    console.log('[NavBar] Set button style to:', buttonStyle);
    
    // Ensure visibility
    await NavigationBar.setVisibilityAsync('visible');
    console.log('[NavBar] Set visibility to: visible');
    
    console.log('[NavBar] Navigation bar configured successfully for', isDarkMode ? 'dark' : 'light', 'mode');
  } catch (error) {
    console.error('[NavBar] Error configuring navigation bar:', error);
  }
}

export async function logNavigationBarStatus() {
  if (Platform.OS !== 'android') {
    return;
  }
  
  try {
    const visibility = await NavigationBar.getVisibilityAsync();
    console.log('[NavBar Status] Current visibility:', visibility);
  } catch (error) {
    console.error('[NavBar Status] Error getting visibility:', error);
  }
}