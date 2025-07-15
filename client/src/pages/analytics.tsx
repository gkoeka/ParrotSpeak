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
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/header';
import { Star, BarChart2, Zap, MessageCircle } from 'lucide-react';

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
  
  const { data: qualityStats, isLoading: isLoadingQuality } = useQuery({
    queryKey: ['/api/analytics/translation-quality'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/translation-quality', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch quality statistics');
      return response.json();
    }
  });
  
  const { data: topLanguages, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/analytics/top-languages'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/top-languages?limit=5', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch top languages');
      return response.json();
    }
  });
  
  const formatNumber = (num: number): string => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  };
  
  // Backend already formats language pairs correctly as "en-US → fr-FR"
  const formatLanguagePair = (pair: string) => {
    return pair || '';
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
          
          {/* Success Rate Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingQuality ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="text-2xl font-bold">
                  {qualityStats?.totalTranslations > 0 ? 'Active' : 'No data'}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {qualityStats?.totalTranslations > 0 ? 
                  'Translation system operational' :
                  'No translations yet'}
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Top Language Pairs */}
          <Card className="col-span-1 lg:col-span-1">
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
                        {lang.count ? 
                          `${Math.round((lang.count / (usageStats?.totalMessages || 1)) * 100)}%` : 
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
          
          {/* Language Pair Usage */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Language Pair Usage</CardTitle>
              <CardDescription>
                Distribution of translation volume by language pair
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLanguages ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : topLanguages && topLanguages.length > 0 ? (
                <div className="space-y-4">
                  {topLanguages.map((languageData, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-sm">{languageData.languagePair}</Label>
                        <span className="text-sm">
                          {formatNumber(languageData.count)} uses
                        </span>
                      </div>
                      <Progress 
                        value={Math.round((languageData.count / (topLanguages[0]?.count || 1)) * 100)} 
                        className="h-2" 
                      />
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