import { languages } from '@/lib/languages';

/**
 * Comprehensive speech synthesis audit for all supported languages
 * This utility helps identify which languages have native voice support
 * and which will need fallback mechanisms.
 */

export interface VoiceSupport {
  languageCode: string;
  languageName: string;
  hasNativeVoice: boolean;
  availableVoices: string[];
  fallbackVoice?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export function auditSpeechSupport(): VoiceSupport[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }

  const allVoices = window.speechSynthesis.getVoices();
  const results: VoiceSupport[] = [];

  for (const language of languages) {
    const langCode = language.code.toLowerCase();
    const langBase = langCode.split('-')[0];

    // Find exact and base language matches
    const exactMatch = allVoices.filter(v => v.lang.toLowerCase() === langCode);
    const baseMatch = allVoices.filter(v => v.lang.toLowerCase().startsWith(langBase));
    
    const hasNativeVoice = exactMatch.length > 0 || baseMatch.length > 0;
    const availableVoices = [...exactMatch, ...baseMatch]
      .map(v => `${v.name} (${v.lang})`)
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    // Determine fallback voice
    let fallbackVoice: string | undefined;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (!hasNativeVoice) {
      // Find fallback voice using same priority as the main implementation
      const englishVoice = allVoices.find(v => v.lang.toLowerCase().includes('en'));
      const spanishVoice = allVoices.find(v => v.lang.toLowerCase().includes('es'));
      const firstVoice = allVoices[0];

      if (englishVoice) {
        fallbackVoice = `${englishVoice.name} (${englishVoice.lang})`;
        riskLevel = 'medium';
      } else if (spanishVoice) {
        fallbackVoice = `${spanishVoice.name} (${spanishVoice.lang})`;
        riskLevel = 'medium';
      } else if (firstVoice) {
        fallbackVoice = `${firstVoice.name} (${firstVoice.lang})`;
        riskLevel = 'high';
      } else {
        riskLevel = 'high';
      }
    }

    results.push({
      languageCode: language.code,
      languageName: language.name,
      hasNativeVoice,
      availableVoices,
      fallbackVoice,
      riskLevel
    });
  }

  return results;
}

export function generateSpeechSupportReport(): string {
  const results = auditSpeechSupport();
  
  const nativeSupport = results.filter(r => r.hasNativeVoice);
  const fallbackSupport = results.filter(r => !r.hasNativeVoice && r.fallbackVoice);
  const noSupport = results.filter(r => !r.hasNativeVoice && !r.fallbackVoice);

  let report = `## Speech Synthesis Support Audit\n\n`;
  report += `**Total Languages**: ${results.length}\n`;
  report += `**Native Voice Support**: ${nativeSupport.length} (${Math.round(nativeSupport.length / results.length * 100)}%)\n`;
  report += `**Fallback Support**: ${fallbackSupport.length} (${Math.round(fallbackSupport.length / results.length * 100)}%)\n`;
  report += `**No Support**: ${noSupport.length} (${Math.round(noSupport.length / results.length * 100)}%)\n\n`;

  if (nativeSupport.length > 0) {
    report += `### ✅ Languages with Native Voice Support (${nativeSupport.length})\n`;
    nativeSupport.forEach(lang => {
      report += `- **${lang.languageName}** (${lang.languageCode}): ${lang.availableVoices.join(', ')}\n`;
    });
    report += `\n`;
  }

  if (fallbackSupport.length > 0) {
    report += `### ⚠️ Languages Using Fallback Voices (${fallbackSupport.length})\n`;
    fallbackSupport.forEach(lang => {
      report += `- **${lang.languageName}** (${lang.languageCode}): Falls back to ${lang.fallbackVoice}\n`;
    });
    report += `\n`;
  }

  if (noSupport.length > 0) {
    report += `### ❌ Languages with No Voice Support (${noSupport.length})\n`;
    noSupport.forEach(lang => {
      report += `- **${lang.languageName}** (${lang.languageCode}): No voice support available\n`;
    });
    report += `\n`;
  }

  // Risk analysis
  const highRisk = results.filter(r => r.riskLevel === 'high');
  const mediumRisk = results.filter(r => r.riskLevel === 'medium');

  if (highRisk.length > 0 || mediumRisk.length > 0) {
    report += `### 🔍 Risk Analysis\n`;
    if (highRisk.length > 0) {
      report += `**High Risk** (${highRisk.length}): ${highRisk.map(r => r.languageName).join(', ')}\n`;
    }
    if (mediumRisk.length > 0) {
      report += `**Medium Risk** (${mediumRisk.length}): ${mediumRisk.map(r => r.languageName).join(', ')}\n`;
    }
  }

  return report;
}

export function logSpeechSupportSummary(): void {
  const results = auditSpeechSupport();
  const nativeCount = results.filter(r => r.hasNativeVoice).length;
  const fallbackCount = results.filter(r => !r.hasNativeVoice && r.fallbackVoice).length;
  const noSupportCount = results.filter(r => !r.hasNativeVoice && !r.fallbackVoice).length;

  console.group('🎤 Speech Synthesis Support Audit');
  console.log(`✅ Native support: ${nativeCount}/${results.length} languages`);
  console.log(`⚠️ Fallback support: ${fallbackCount}/${results.length} languages`);
  console.log(`❌ No support: ${noSupportCount}/${results.length} languages`);
  
  if (noSupportCount > 0) {
    const unsupported = results.filter(r => !r.hasNativeVoice && !r.fallbackVoice);
    console.warn('Languages without any voice support:', unsupported.map(r => r.languageName));
  }
  
  console.groupEnd();
}