import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  loadThemePreference: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from storage
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme');
      console.log('[ThemeContext] Loading theme preference:', savedTheme);
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    try {
      await SecureStore.setItemAsync('theme', newMode ? 'dark' : 'light');
      console.log('[ThemeContext] Theme saved:', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, loadThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};