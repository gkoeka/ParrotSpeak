import { MessageCircle, Lightbulb } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
// Removed unused imports
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Voice control imports are kept but not used - for future implementation
// import { useVoiceControl } from '@/hooks/use-voice-control';
// import { useState, useEffect } from 'react';

export default function Header() {
  const [, navigate] = useLocation();
  
  // Voice control code removed as requested, but kept in codebase for future implementation
  /*
  const { 
    isVoiceControlEnabled, 
    toggleVoiceControl, 
    isListening, 
    hasVoiceControlSupport,
    registerCommands 
  } = useVoiceControl();
  
  // Register voice commands for navigation
  useEffect(() => {
    if (hasVoiceControlSupport) {
      registerCommands([
        {
          command: "go home",
          aliases: ["show home", "main screen"],
          handler: () => navigate('/')
        },
        {
          command: "settings",
          aliases: ["voice settings", "show settings"],
          handler: () => navigate('/settings')
        },
        {
          command: "analytics",
          aliases: ["show analytics", "statistics"],
          handler: () => navigate('/analytics')
        },
        {
          command: "mobile preview",
          aliases: ["show mobile", "preview mobile"],
          handler: () => navigate('/mobile-preview')
        },
        {
          command: "new conversation",
          aliases: ["start new", "create conversation"],
          handler: () => {
            // This would need to be connected to the conversation creation logic
            navigate('/');
          }
        }
      ]);
    }
  }, [hasVoiceControlSupport, registerCommands, navigate]);
  */
  
  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side with logo */}
        <div className="w-1/4 flex items-center justify-start">
          <img 
            src="/images/parrotspeak-logo.png" 
            alt="ParrotSpeak Logo" 
            className="h-9 w-9"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Centered app title */}
        <div className="w-2/4 flex justify-center items-center">
          <h1 className="text-xl font-bold text-center">ParrotSpeak</h1>
        </div>
        
        {/* Right side with Feedback button */}
        <div className="w-1/4 flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 px-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            onClick={() => navigate('/settings?tab=feedback')}
          >
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs font-medium hidden sm:inline">Feedback</span>
          </Button>
        </div>
      </div>
    </header>
  );
}