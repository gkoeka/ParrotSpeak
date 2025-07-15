import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/header';
import { BarChart2, Zap, MessageCircle } from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Calculate date range based on selected timeRange
  const getDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0]; // Today
    let startDate: string;
    
    switch (timeRange) {
      case 'week':
        // 7 days ago
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'year':
        // 365 days ago
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
      default:
        // 30 days ago
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch analytics data
  const { data: usageStats, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/analytics/usage', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/usage?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch usage statistics');
      return response.json();
    }
  });
  

  
  const { data: allLanguages, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/analytics/top-languages'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/top-languages', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch top languages');
      return await response.json();
    }
  });

  // Calculate the top 5 for display and total sum for percentage calculation
  const topLanguages = allLanguages?.slice(0, 5) || [];
  const totalLanguagePairCount = allLanguages?.reduce((sum: number, lang: any) => sum + (lang.count || 0), 0) || 0;
  
  const formatNumber = (num: number): string => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };
  
  // Convert language codes to human-readable names
  const getLanguageName = (code: string): string => {
    const languageMap: { [key: string]: string } = {
      'en-US': 'English',
      'en-GB': 'English (UK)',
      'es-ES': 'Spanish',
      'es-MX': 'Spanish (Mexico)',
      'fr-FR': 'French',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'pt-PT': 'Portuguese',
      'pt-BR': 'Portuguese (Brazil)',
      'ru-RU': 'Russian',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'ar-SA': 'Arabic',
      'hi-IN': 'Hindi',
      'th-TH': 'Thai',
      'vi-VN': 'Vietnamese',
      'nl-NL': 'Dutch',
      'sv-SE': 'Swedish',
      'da-DK': 'Danish',
      'no-NO': 'Norwegian',
      'fi-FI': 'Finnish',
      'pl-PL': 'Polish',
      'cs-CZ': 'Czech',
      'hu-HU': 'Hungarian',
      'ro-RO': 'Romanian',
      'bg-BG': 'Bulgarian',
      'hr-HR': 'Croatian',
      'sk-SK': 'Slovak',
      'sl-SI': 'Slovenian',
      'et-EE': 'Estonian',
      'lv-LV': 'Latvian',
      'lt-LT': 'Lithuanian',
      'uk-UA': 'Ukrainian',
      'be-BY': 'Belarusian',
      'el-GR': 'Greek',
      'tr-TR': 'Turkish',
      'he-IL': 'Hebrew',
      'fa-IR': 'Persian',
      'ur-PK': 'Urdu',
      'bn-BD': 'Bengali',
      'ta-IN': 'Tamil',
      'te-IN': 'Telugu',
      'ml-IN': 'Malayalam',
      'kn-IN': 'Kannada',
      'gu-IN': 'Gujarati',
      'pa-IN': 'Punjabi',
      'mr-IN': 'Marathi',
      'or-IN': 'Odia',
      'as-IN': 'Assamese',
      'ne-NP': 'Nepali',
      'si-LK': 'Sinhala',
      'my-MM': 'Burmese',
      'km-KH': 'Khmer',
      'lo-LA': 'Lao',
      'ka-GE': 'Georgian',
      'am-ET': 'Amharic',
      'sw-KE': 'Swahili',
      'zu-ZA': 'Zulu',
      'af-ZA': 'Afrikaans',
      'is-IS': 'Icelandic',
      'mt-MT': 'Maltese',
      'cy-GB': 'Welsh',
      'ga-IE': 'Irish',
      'gd-GB': 'Scottish Gaelic',
      'eu-ES': 'Basque',
      'ca-ES': 'Catalan',
      'gl-ES': 'Galician',
      'lb-LU': 'Luxembourgish',
      'mk-MK': 'Macedonian',
      'sq-AL': 'Albanian',
      'bs-BA': 'Bosnian',
      'sr-RS': 'Serbian',
      'me-ME': 'Montenegrin',
      'az-AZ': 'Azerbaijani',
      'kk-KZ': 'Kazakh',
      'ky-KG': 'Kyrgyz',
      'uz-UZ': 'Uzbek',
      'tg-TJ': 'Tajik',
      'tk-TM': 'Turkmen',
      'mn-MN': 'Mongolian',
    };
    return languageMap[code] || code;
  };

  const formatLanguagePair = (pair: string) => {
    if (!pair) return '';
    const [source, target] = pair.split(' → ');
    if (source && target) {
      return `${getLanguageName(source)} → ${getLanguageName(target)}`;
    }
    return pair;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-6 container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'year')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {/* Messages Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Messages
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingUsage ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(usageStats?.totalMessages || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {timeRange === 'week' ? 'Past 7 days' : 
                 timeRange === 'month' ? 'Past 30 days' : 'Past 365 days'}
              </p>
            </CardContent>
          </Card>
          
          {/* Conversations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Translations
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingUsage ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(usageStats?.totalTranslations || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {timeRange === 'week' ? 'Past 7 days' : 
                 timeRange === 'month' ? 'Past 30 days' : 'Past 365 days'}
              </p>
            </CardContent>
          </Card>

          {/* Average Response Time Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Daily Average
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingUsage ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {usageStats?.dailyAverage ? 
                    `${usageStats.dailyAverage}/day` : 
                    'No data'}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Average translations per day
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {/* Top Language Pairs */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Top Language Pairs</CardTitle>
              <CardDescription>
                Most frequently used translation pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLanguages ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : topLanguages && topLanguages.length > 0 ? (
                <div className="space-y-4">
                  {topLanguages.map((lang, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {formatLanguagePair(lang.languagePair)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(lang.count)} messages
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {lang.count && totalLanguagePairCount > 0 ? 
                          `${Math.round((lang.count / totalLanguagePairCount) * 100)}%` : 
                          '0%'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No language usage data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}