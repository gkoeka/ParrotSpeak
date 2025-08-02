import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LanguageSelector from '../LanguageSelectorMobile';
import { getSupportedLanguages } from '../../constants/languageConfiguration';

// Mock the language configuration
jest.mock('../../constants/languageConfiguration', () => ({
  getSupportedLanguages: jest.fn()
}));

// Mock the RTL support utilities
jest.mock('../../utils/rtlSupport', () => ({
  isRTLLanguage: jest.fn((code: string) => ['ar', 'he', 'fa', 'ur'].includes(code)),
  rtlStyle: jest.fn((style: any) => style),
  getWritingDirection: jest.fn((code: string) => ['ar', 'he', 'fa', 'ur'].includes(code) ? 'rtl' : 'ltr')
}));

describe('LanguageSelectorMobile', () => {
  const mockLanguages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      country: 'United States',
      flag: '🇺🇸',
      speechSupported: true,
      speechToTextSupported: true,
      textToSpeechSupported: true,
      popularity: 10
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      country: 'Spain',
      flag: '🇪🇸',
      speechSupported: true,
      speechToTextSupported: true,
      textToSpeechSupported: true,
      popularity: 9
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      country: 'Saudi Arabia',
      flag: '🇸🇦',
      speechSupported: true,
      speechToTextSupported: true,
      textToSpeechSupported: true,
      popularity: 8
    },
    {
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      country: 'Israel',
      flag: '🇮🇱',
      speechSupported: true,
      speechToTextSupported: true,
      textToSpeechSupported: true,
      popularity: 4
    },
    {
      code: 'sl',
      name: 'Slovenian',
      nativeName: 'Slovenščina',
      country: 'Slovenia',
      flag: '🇸🇮',
      speechSupported: true,
      speechToTextSupported: true,
      textToSpeechSupported: true,
      popularity: 2
    },
    {
      code: 'kk',
      name: 'Kazakh',
      nativeName: 'Қазақ тілі',
      country: 'Kazakhstan',
      flag: '🇰🇿',
      speechSupported: false,
      speechToTextSupported: false,
      textToSpeechSupported: false,
      popularity: 1
    }
  ];

  const defaultProps = {
    sourceLanguage: 'en',
    targetLanguage: 'es',
    onSourceLanguageChange: jest.fn(),
    onTargetLanguageChange: jest.fn()
  };

  beforeEach(() => {
    (getSupportedLanguages as jest.Mock).mockReturnValue(mockLanguages);
    jest.clearAllMocks();
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot for default state', () => {
      const { toJSON } = render(<LanguageSelector {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with RTL languages selected', () => {
      const { toJSON } = render(
        <LanguageSelector 
          {...defaultProps} 
          sourceLanguage="ar"
          targetLanguage="he"
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with text-only language selected', () => {
      const { toJSON } = render(
        <LanguageSelector 
          {...defaultProps} 
          sourceLanguage="en"
          targetLanguage="kk"
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot when source modal is open', async () => {
      const { getByTestId, toJSON } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot when target modal is open', async () => {
      const { getByTestId, toJSON } = render(<LanguageSelector {...defaultProps} />);
      
      const targetButton = getByTestId('target-language-button');
      fireEvent.press(targetButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with search results', async () => {
      const { getByTestId, getByPlaceholderText, toJSON } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      const searchInput = getByPlaceholderText('Search languages...');
      fireEvent.changeText(searchInput, 'slov');
      
      await waitFor(() => {
        // Wait for search to filter results
      });
      
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with no search results', async () => {
      const { getByTestId, getByPlaceholderText, toJSON } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      const searchInput = getByPlaceholderText('Search languages...');
      fireEvent.changeText(searchInput, 'xyz123');
      
      await waitFor(() => {
        // Wait for search to filter results
      });
      
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot after swapping languages', () => {
      const { getByTestId, toJSON } = render(<LanguageSelector {...defaultProps} />);
      
      const swapButton = getByTestId('swap-languages-button');
      fireEvent.press(swapButton);
      
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot in dark mode', () => {
      // Mock dark mode
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        useColorScheme: () => 'dark'
      }));
      
      const { toJSON } = render(<LanguageSelector {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with all language variants', () => {
      const extendedLanguages = [
        ...mockLanguages,
        {
          code: 'es-ES',
          name: 'Spanish (Spain)',
          nativeName: 'Español (España)',
          country: 'Spain',
          flag: '🇪🇸',
          speechSupported: true,
          speechToTextSupported: true,
          textToSpeechSupported: true,
          popularity: 8
        },
        {
          code: 'es-419',
          name: 'Spanish (Latin America)',
          nativeName: 'Español (Latinoamérica)',
          country: 'Mexico',
          flag: '🇲🇽',
          speechSupported: true,
          speechToTextSupported: true,
          textToSpeechSupported: true,
          popularity: 8
        }
      ];
      
      (getSupportedLanguages as jest.Mock).mockReturnValue(extendedLanguages);
      
      const { toJSON } = render(<LanguageSelector {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Interaction Tests', () => {
    it('should open source language modal when source button is pressed', async () => {
      const { getByTestId, queryByTestId } = render(<LanguageSelector {...defaultProps} />);
      
      expect(queryByTestId('language-modal')).toBeNull();
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
    });

    it('should call onSourceLanguageChange when a language is selected', async () => {
      const { getByTestId, getByText } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      const arabicOption = getByText('Arabic');
      fireEvent.press(arabicOption);
      
      expect(defaultProps.onSourceLanguageChange).toHaveBeenCalledWith('ar');
    });

    it('should filter languages based on search input', async () => {
      const { getByTestId, getByPlaceholderText, queryByText, getAllByText } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      const searchInput = getByPlaceholderText('Search languages...');
      fireEvent.changeText(searchInput, 'arab');
      
      await waitFor(() => {
        // Arabic should be visible
        const arabicElements = queryByText('Arabic');
        expect(arabicElements).toBeTruthy();
        // Spanish and other languages should not be visible after filtering
        expect(queryByText('Spanish')).toBeNull();
      });
    });

    it('should swap languages when swap button is pressed', () => {
      const { getByTestId } = render(<LanguageSelector {...defaultProps} />);
      
      const swapButton = getByTestId('swap-languages-button');
      fireEvent.press(swapButton);
      
      expect(defaultProps.onSourceLanguageChange).toHaveBeenCalledWith('es');
      expect(defaultProps.onTargetLanguageChange).toHaveBeenCalledWith('en');
    });

    it('should close modal when backdrop is pressed', async () => {
      const { getByTestId, queryByTestId } = render(<LanguageSelector {...defaultProps} />);
      
      const sourceButton = getByTestId('source-language-button');
      fireEvent.press(sourceButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      const backdrop = getByTestId('modal-backdrop');
      fireEvent.press(backdrop);
      
      await waitFor(() => {
        expect(queryByTestId('language-modal')).toBeNull();
      });
    });

    it('should display text-only badge for unsupported languages', async () => {
      const { getByTestId, getByText, queryByText } = render(<LanguageSelector {...defaultProps} />);
      
      const targetButton = getByTestId('target-language-button');
      fireEvent.press(targetButton);
      
      await waitFor(() => {
        expect(getByTestId('language-modal')).toBeTruthy();
      });
      
      // Kazakh is marked as text-only in our mock data
      // Check that Kazakh appears with text-only indicator
      expect(queryByText('Kazakh (Text Only)')).toBeTruthy();
      expect(queryByText('TEXT')).toBeTruthy();
    });
  });
});