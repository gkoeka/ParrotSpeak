import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function MobilePreviewPage() {
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [iframeHeight, setIframeHeight] = useState<number>(667);
  const [iframeScale, setIframeScale] = useState<number>(1);
  
  // Available screens for preview
  const screens = [
    { id: 'home', name: 'Home' },
    { id: 'conversation', name: 'Conversation' },
    { id: 'conversations', name: 'Conversations List' },
    { id: 'voiceSettings', name: 'Voice Settings' },
    { id: 'settings', name: 'Settings' },
    { id: 'analytics', name: 'Analytics' }
  ];
  
  // Find current screen object
  const screen = screens.find(s => s.id === currentScreen) || screens[0];
  
  const adjustHeight = (delta: number) => {
    setIframeHeight(prev => Math.max(500, Math.min(800, prev + delta)));
  };
  
  const adjustScale = (delta: number) => {
    setIframeScale(prev => Math.max(0.5, Math.min(1.5, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Mobile Preview</h1>
          </div>
          <Badge variant="secondary">ParrotSpeak Mobile App</Badge>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Controls Panel */}
          <div className="lg:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Screen Navigation</CardTitle>
                <CardDescription>Select a screen to preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {screens.map((screenOption) => (
                  <Button
                    key={screenOption.id}
                    variant={currentScreen === screenOption.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setCurrentScreen(screenOption.id)}
                  >
                    {screenOption.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Controls</CardTitle>
                <CardDescription>Adjust the mobile preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Height</span>
                    <Badge variant="secondary">{iframeHeight}px</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => adjustHeight(-50)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => adjustHeight(50)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Scale</span>
                    <Badge variant="secondary">{Math.round(iframeScale * 100)}%</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => adjustScale(-0.1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => adjustScale(0.1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>App Features</CardTitle>
                <CardDescription>Available in the mobile app</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Real-time voice translation</li>
                  <li>• 100+ supported languages</li>
                  <li>• Offline mode available</li>
                  <li>• Conversation history</li>
                  <li>• Custom voice profiles</li>
                  <li>• Usage analytics</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Mobile Phone Frame */}
          <div className="lg:w-2/3">
            <div className="flex flex-col items-center">
              <div 
                className="bg-black rounded-[40px] p-3 shadow-2xl overflow-hidden relative"
                style={{ 
                  width: `${375 * iframeScale}px`,
                  height: `${(iframeHeight + 50) * iframeScale}px`
                }}
              >
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-10"></div>
                
                {/* Phone screen */}
                <div className="bg-white h-full rounded-[30px] overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="h-6 bg-gray-100 flex justify-between items-center px-4 text-black shrink-0">
                    <div className="text-[10px] font-medium">9:41 AM</div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
                      <div className="w-3 h-2 bg-gray-400 rounded-sm"></div>
                      <div className="w-3 h-2 bg-gray-400 rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* App header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 text-center font-semibold shrink-0">
                    ParrotSpeak
                  </div>
                  
                  {/* Navigation tabs */}
                  <div className="flex bg-gray-100 border-b shrink-0">
                    <div className="flex-1 p-2 text-center text-xs border-b-2 border-transparent">Translate</div>
                    <div className="flex-1 p-2 text-center text-xs border-b-2 border-blue-500 bg-white text-blue-500 font-medium">
                      {screen.name}
                    </div>
                    <div className="flex-1 p-2 text-center text-xs border-b-2 border-transparent">Settings</div>
                  </div>
                  
                  {/* Main content area */}
                  <div className="flex-1 p-3 overflow-y-auto">
                    {screen.id === 'home' && (
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl">
                            🎤
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Ready to Translate</h3>
                          <p className="text-sm text-gray-600">Tap the microphone to start voice translation</p>
                        </div>
                        <div className="flex justify-between items-center bg-gray-100 rounded-lg p-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">From</div>
                            <div className="font-medium">English</div>
                          </div>
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                            ⇄
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">To</div>
                            <div className="font-medium">Spanish</div>
                          </div>
                        </div>
                        <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium">
                          Start Translation
                        </button>
                      </div>
                    )}
                    
                    {screen.id === 'conversation' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Active Conversation</h3>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Live</div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-blue-100 rounded-lg p-3">
                            <div className="text-sm text-blue-800 font-medium">You (English)</div>
                            <div className="text-gray-800">Hello, how are you today?</div>
                          </div>
                          
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="text-sm text-gray-600 font-medium">Translation (Spanish)</div>
                            <div className="text-gray-800">Hola, ¿cómo estás hoy?</div>
                          </div>
                          
                          <div className="bg-purple-100 rounded-lg p-3">
                            <div className="text-sm text-purple-800 font-medium">Response (Spanish)</div>
                            <div className="text-gray-800">Muy bien, gracias. ¿Y tú?</div>
                          </div>
                          
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="text-sm text-gray-600 font-medium">Translation (English)</div>
                            <div className="text-gray-800">Very well, thank you. And you?</div>
                          </div>
                        </div>
                        
                        <div className="text-center pt-4">
                          <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                            🎤
                          </button>
                          <p className="text-xs text-gray-500 mt-2">Tap to speak</p>
                        </div>
                      </div>
                    )}
                    
                    {screen.id === 'conversations' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Recent Conversations</h3>
                        
                        <div className="space-y-3">
                          <div className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">English ↔ Spanish Chat</div>
                                <div className="text-xs text-gray-500">en-US → es-ES</div>
                                <div className="text-xs text-gray-400 mt-1">32 messages • 45 min ago</div>
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">Business Meeting</div>
                                <div className="text-xs text-gray-500">en-US → fr-FR</div>
                                <div className="text-xs text-gray-400 mt-1">18 messages • 2 hours ago</div>
                              </div>
                              <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Saved</div>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">Travel Assistance</div>
                                <div className="text-xs text-gray-500">en-US → ja-JP</div>
                                <div className="text-xs text-gray-400 mt-1">7 messages • 1 day ago</div>
                              </div>
                              <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Saved</div>
                            </div>
                          </div>
                        </div>
                        
                        <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium mt-4">
                          Start New Conversation
                        </button>
                      </div>
                    )}
                    
                    {screen.id === 'settings' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Settings</h3>
                        
                        <div className="space-y-4">
                          <div className="bg-white border rounded-lg p-3">
                            <div className="font-medium text-sm mb-2">Language Preferences</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Primary Language</span>
                                <span className="text-blue-600">English (US)</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Auto-detect Language</span>
                                <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white border rounded-lg p-3">
                            <div className="font-medium text-sm mb-2">Voice Settings</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Voice Speed</span>
                                <span className="text-blue-600">Normal</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Voice Quality</span>
                                <span className="text-blue-600">High</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {screen.id === 'analytics' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Usage Analytics</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-blue-800">247</div>
                            <div className="text-xs text-blue-600">Total Translations</div>
                          </div>
                          <div className="bg-green-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-800">12</div>
                            <div className="text-xs text-green-600">Languages Used</div>
                          </div>
                          <div className="bg-purple-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-800">45h</div>
                            <div className="text-xs text-purple-600">Total Time</div>
                          </div>
                          <div className="bg-orange-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-orange-800">23</div>
                            <div className="text-xs text-orange-600">Conversations</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {screen.id === 'voiceSettings' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Voice Settings</h3>
                        
                        <div className="bg-white border rounded-lg p-3">
                          <div className="font-medium text-sm mb-3">Voice Profiles</div>
                          <div className="space-y-2">
                            <div className="border-b pb-2">
                              <div className="font-medium text-sm">Default Voice</div>
                              <div className="text-xs text-gray-500">Neural voice • High quality</div>
                            </div>
                            <div className="border-b pb-2">
                              <div className="font-medium text-sm">Business Voice</div>
                              <div className="text-xs text-gray-500">Professional • Medium speed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom navigation */}
                  <div className="bg-gray-100 border-t flex justify-around py-2 shrink-0">
                    <button 
                      onClick={() => setCurrentScreen('home')}
                      className={`flex flex-col items-center p-2 ${currentScreen === 'home' ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                      <div>🏠</div>
                      <div className="text-xs">Home</div>
                    </button>
                    <button 
                      onClick={() => setCurrentScreen('conversations')}
                      className={`flex flex-col items-center p-2 ${currentScreen === 'conversations' ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                      <div>📋</div>
                      <div className="text-xs">History</div>
                    </button>
                    <button 
                      onClick={() => setCurrentScreen('analytics')}
                      className={`flex flex-col items-center p-2 ${currentScreen === 'analytics' ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                      <div>📊</div>
                      <div className="text-xs">Stats</div>
                    </button>
                    <button 
                      onClick={() => setCurrentScreen('settings')}
                      className={`flex flex-col items-center p-2 ${currentScreen === 'settings' ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                      <div>⚙️</div>
                      <div className="text-xs">Settings</div>
                    </button>
                  </div>
                  
                  {/* Home indicator */}
                  <div className="h-4 flex justify-center items-center shrink-0">
                    <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-4 text-center">Interactive mobile interface preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}