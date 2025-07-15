import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSpeechSettings } from "@/hooks/use-speech-settings";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languages } from "@/lib/languages";
import { Moon, Sun, Eye, Megaphone, AccessibilityIcon, BarChart2, Settings, MessageCircle, Loader2, Star, Mail, Send, Heart, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/providers/theme-provider";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("voice");

  // Check URL parameters on page load to automatically switch to feedback tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    console.log('URL tab parameter:', tabParam); // Debug log
    if (tabParam === 'feedback') {
      console.log('Setting active tab to feedback'); // Debug log
      setActiveTab('feedback');
    }
  }, []);
  
  // Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'feature' | 'translation' | 'other'>('other');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Voice profiles
  const { data: voiceProfiles, isLoading: isLoadingProfiles } = useQuery<any[]>({
    queryKey: ['/api/voice-profiles'],
    queryFn: async () => {
      const response = await fetch('/api/voice-profiles');
      if (!response.ok) throw new Error('Failed to load voice profiles');
      return response.json();
    }
  });

  // Use the proper speech settings hook
  const { settings: speechSettings, updateSettings, isLoading: isLoadingSettings, isUpdating } = useSpeechSettings();
  
  // Only provide defaults while loading, not when we have actual data
  const settingsWithDefaults = speechSettings || (isLoadingSettings ? {
    autoPlay: true,
    useProfileForLanguage: true,
    defaultProfileId: null
  } : speechSettings);

  // Accessibility settings (stored in localStorage)
  const [fontSize, setFontSize] = useState<number>(
    typeof window !== 'undefined' 
      ? parseInt(localStorage.getItem('fontSize') || '100') 
      : 100
  );
  
  const [highContrast, setHighContrast] = useState<boolean>(
    typeof window !== 'undefined' 
      ? localStorage.getItem('highContrast') === 'true'
      : false
  );

  // Use the proper theme provider instead of custom dark mode logic
  const { theme, setTheme } = useTheme();

  // Handle speech settings changes using the proper hook
  const handleSpeechSettingChange = async (setting: string, value: any) => {
    try {
      await updateSettings({ [setting]: value });
      
      // Show success toast
      toast({
        title: "Settings Updated", 
        description: "Your speech settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle accessibility settings changes
  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0];
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize.toString());
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    localStorage.setItem('highContrast', checked.toString());
    if (checked) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Use theme provider to handle theme changes
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };
  
  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmittingFeedback(true);
      
      const response = await apiRequest("POST", "/api/feedback", {
        feedback: feedbackText,
        category: feedbackCategory,
        email: feedbackEmail || undefined
      });
      
      if (response.ok) {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback! We appreciate your help making ParrotSpeak better."
        });
        
        // Reset form
        setFeedbackText("");
        setFeedbackEmail("");
        setFeedbackCategory("other");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoadingProfiles || isLoadingSettings) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="voice" className="flex items-center gap-1">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Voice & Speech</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-1">
            <AccessibilityIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
        </TabsList>

        {/* Voice & Speech Settings */}
        <TabsContent value="voice">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voice Playback</CardTitle>
                <CardDescription>Configure how voice playback works in conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-play">Auto-play translations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play translated messages when received
                    </p>
                  </div>
                  <Switch 
                    id="auto-play" 
                    checked={settingsWithDefaults.autoPlay}
                    onCheckedChange={(checked) => handleSpeechSettingChange('autoPlay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="language-profiles">Use language-specific profiles</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically select voice profiles based on language
                    </p>
                  </div>
                  <Switch 
                    id="language-profiles" 
                    checked={settingsWithDefaults.useProfileForLanguage}
                    onCheckedChange={(checked) => handleSpeechSettingChange('useProfileForLanguage', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="default-profile">Default voice profile</Label>
                  <Select 
                    value={settingsWithDefaults.defaultProfileId || ''} 
                    onValueChange={(value) => handleSpeechSettingChange('defaultProfileId', value)}
                  >
                    <SelectTrigger id="default-profile" className="mt-1">
                      <SelectValue placeholder="Select default profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceProfiles?.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name} ({languages.find(l => l.code === profile.languageCode)?.name || profile.languageCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    This profile will be used when no language-specific profile is found
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice Profiles</CardTitle>
                <CardDescription>Manage your voice profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/voice-settings'}
                  className="w-full"
                >
                  Manage Voice Profiles
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accessibility Settings */}
        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Options</CardTitle>
              <CardDescription>Customize the app for better accessibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="font-size">Text Size</Label>
                  <span className="text-sm font-medium">{fontSize}%</span>
                </div>
                <Slider 
                  id="font-size"
                  value={[fontSize]} 
                  min={75} 
                  max={150} 
                  step={5} 
                  onValueChange={handleFontSizeChange} 
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Adjust the size of text throughout the application
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility in bright light
                  </p>
                </div>
                <Switch 
                  id="high-contrast" 
                  checked={highContrast}
                  onCheckedChange={handleHighContrastChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme Preference</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color theme
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant={theme === "light" ? "default" : "outline"} 
                    onClick={() => handleThemeChange('light')} 
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button 
                    variant={theme === "dark" ? "default" : "outline"} 
                    onClick={() => handleThemeChange('dark')} 
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Translation Analytics</CardTitle>
              <CardDescription>View metrics about your translations and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground">
                  Track your translation quality, usage patterns, and most frequently used language pairs
                </p>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  asChild
                >
                  <Link href="/analytics">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View Analytics Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Send Feedback</CardTitle>
              <CardDescription>Help us improve ParrotSpeak by sending your feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="feedback-category">Feedback Type</Label>
                  <Select 
                    defaultValue="other"
                    onValueChange={(value) => setFeedbackCategory(value as 'bug' | 'feature' | 'translation' | 'other')}
                  >
                    <SelectTrigger id="feedback-category" className="mt-1">
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Report a Bug</SelectItem>
                      <SelectItem value="feature">Suggest a Feature</SelectItem>
                      <SelectItem value="translation">Translation Issue</SelectItem>
                      <SelectItem value="other">Other Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="feedback-text">Your Feedback</Label>
                  <textarea 
                    id="feedback-text" 
                    className="flex h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    placeholder="Please describe your feedback in detail..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="feedback-email">Your Email (optional)</Label>
                  <p className="text-sm text-muted-foreground">If you'd like us to follow up with you</p>
                  <input 
                    id="feedback-email" 
                    type="email"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    placeholder="your.email@example.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                  />
                </div>

                <Button 
                  className="mt-6 bg-blue-600 hover:bg-blue-700" 
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  onClick={handleSubmitFeedback}
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>

                {/* Future Considerations */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">What We're Considering for the Future</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Reduce translation and voice conversation delays to under 500 milliseconds</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Add more native voices to more languages</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Continuously listening for both languages, no button pushing needed by the users</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">QR code to share the app</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Automatically recognize the speaker's language</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Group conversation in more than two languages</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Ongoing security and functional improvements</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Replay capability to review past conversations</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Interface localization to support users worldwide in their native languages</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Digital video pen pal feature to promote cross-cultural understanding and world peace</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Share inspiring traveler success stories from ParrotSpeak users</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-muted-foreground">Build an employee-owned business that prioritizes compassion, empathy, and workplace happiness through sustainable growth</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    These are ideas we're exploring based on user feedback. Your input helps shape our roadmap.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}