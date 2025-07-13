import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { languages } from '@/lib/languages';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

// Test phrases for different language families
const testPhrases: Record<string, string> = {
  'en-US': 'Hello, how are you today?',
  'es-ES': 'Hola, ¿cómo estás hoy?',
  'fr-FR': 'Bonjour, comment allez-vous aujourd\'hui?',
  'de-DE': 'Hallo, wie geht es dir heute?',
  'it-IT': 'Ciao, come stai oggi?',
  'pt-BR': 'Olá, como você está hoje?',
  'ja-JP': 'こんにちは、今日はどうですか？',
  'zh-CN': '你好，你今天怎么样？',
  'ko-KR': '안녕하세요, 오늘 어떠세요?',
  'ru-RU': 'Привет, как дела сегодня?',
  'ar-SA': 'مرحبا، كيف حالك اليوم؟',
  'hi-IN': 'नमस्ते, आज आप कैसे हैं?',
  'th-TH': 'สวัสดี วันนี้คุณเป็นอย่างไร?',
  'vi-VN': 'Xin chào, hôm nay bạn thế nào?',
  'tr-TR': 'Merhaba, bugün nasılsın?',
  'pl-PL': 'Cześć, jak się masz dzisiaj?',
  'nl-NL': 'Hallo, hoe gaat het vandaag?',
  'sv-SE': 'Hej, hur mår du idag?',
  'cs-CZ': 'Ahoj, jak se máš dnes?',
  'hu-HU': 'Szia, hogy vagy ma?'
};

interface LanguageTestResult {
  languageCode: string;
  languageName: string;
  status: 'untested' | 'testing' | 'success' | 'failed';
  error?: string;
  hasNativeVoice?: boolean;
}

export function LanguageTestPanel() {
  const [testResults, setTestResults] = useState<Record<string, LanguageTestResult>>({});
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const { speak, isSpeaking, error } = useTextToSpeech();

  // Select representative languages from different families
  const testLanguages = Object.keys(testPhrases).map(code => ({
    code,
    language: languages.find(l => l.code === code)
  })).filter(item => item.language);

  const testSingleLanguage = async (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode);
    if (!language) return;

    setTestResults(prev => ({
      ...prev,
      [languageCode]: {
        languageCode,
        languageName: language.name,
        status: 'testing'
      }
    }));

    try {
      const phrase = testPhrases[languageCode];
      
      // Check if browser has native voice support for this language
      const allVoices = window.speechSynthesis?.getVoices() || [];
      const langBase = languageCode.split('-')[0].toLowerCase();
      const hasNativeVoice = allVoices.some(v => 
        v.lang.toLowerCase() === languageCode.toLowerCase() ||
        v.lang.toLowerCase().startsWith(langBase)
      );

      await new Promise<void>((resolve, reject) => {
        const onEnd = () => {
          setTestResults(prev => ({
            ...prev,
            [languageCode]: {
              languageCode,
              languageName: language.name,
              status: 'success',
              hasNativeVoice
            }
          }));
          resolve();
        };

        // Set a timeout to catch silent failures
        const timeout = setTimeout(() => {
          setTestResults(prev => ({
            ...prev,
            [languageCode]: {
              languageCode,
              languageName: language.name,
              status: 'failed',
              error: 'Speech timeout - no audio detected',
              hasNativeVoice
            }
          }));
          reject(new Error('Speech timeout'));
        }, 5000);

        speak(phrase, languageCode, undefined, () => {
          clearTimeout(timeout);
          onEnd();
        });
      });

    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [languageCode]: {
          languageCode,
          languageName: language.name,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err)
        }
      }));
    }
  };

  const runBatchTest = async () => {
    setIsRunningBatch(true);
    setTestResults({});

    for (const { code } of testLanguages) {
      await testSingleLanguage(code);
      // Small delay between tests to avoid overwhelming the speech synthesis
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunningBatch(false);
  };

  const getStatusIcon = (status: LanguageTestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <Volume2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <VolumeX className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const successCount = Object.values(testResults).filter(r => r.status === 'success').length;
  const failedCount = Object.values(testResults).filter(r => r.status === 'failed').length;
  const nativeVoiceCount = Object.values(testResults).filter(r => r.hasNativeVoice).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Language Speech Support Test</span>
          <Button 
            onClick={runBatchTest} 
            disabled={isRunningBatch || isSpeaking}
            className="ml-4"
          >
            {isRunningBatch ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Batch Test'
            )}
          </Button>
        </CardTitle>
        {Object.keys(testResults).length > 0 && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>✅ Success: {successCount}/{testLanguages.length} languages</div>
            <div>❌ Failed: {failedCount}/{testLanguages.length} languages</div>
            <div>🎤 Native Voice: {nativeVoiceCount}/{testLanguages.length} languages</div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testLanguages.map(({ code, language }) => {
            if (!language) return null;
            
            const result = testResults[code];
            const phrase = testPhrases[code];

            return (
              <div 
                key={code}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={language.flag} 
                      alt={language.country}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-medium text-sm">{language.name}</span>
                  </div>
                  {getStatusIcon(result?.status || 'untested')}
                </div>
                
                <div className="text-xs text-gray-600">
                  {phrase}
                </div>
                
                {result?.hasNativeVoice !== undefined && (
                  <div className="text-xs">
                    Voice: {result.hasNativeVoice ? '🎤 Native' : '🔄 Fallback'}
                  </div>
                )}
                
                {result?.error && (
                  <div className="text-xs text-red-600">
                    {result.error}
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => testSingleLanguage(code)}
                  disabled={result?.status === 'testing' || isSpeaking}
                >
                  {result?.status === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              </div>
            );
          })}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">
              Speech Error: {error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}