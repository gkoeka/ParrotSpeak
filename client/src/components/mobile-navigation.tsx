import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Camera, History, MessageCircle, User, Settings } from 'lucide-react';
import VisualTranslation from '@/components/visual-translation';
import { useContext } from 'react';
import { ConversationContext } from '@/providers/conversation-provider';
import { useAuthContext } from '@/providers/auth-provider';

export default function MobileNavigation() {
  const [location, navigate] = useLocation();
  const { sourceLanguage, targetLanguage, sendMessage } = useContext(ConversationContext);
  const { isAuthenticated } = useAuthContext();
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path === '/conversations' && location === '/conversations') return true;
    if (path === '/settings' && (location === '/settings' || location === '/analytics' || location === '/voice-settings')) return true;
    if (path.startsWith('/conversation/') && location.startsWith('/conversation/')) return true;
    return false;
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background dark:bg-background border-t border-border z-10 md:hidden">
      <nav className="flex justify-around items-center h-16">
        <button
          className={`flex flex-col items-center justify-center p-2 w-1/5 h-full ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => {
            // Clear any existing conversation ID from the URL
            // This will force the Home component to create a new conversation
            navigate('/');
          }}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs mt-1">Chat</span>
        </button>
        
        <button
          className={`flex flex-col items-center justify-center p-2 w-1/5 h-full ${
            isActive('/conversations') ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => navigate('/conversations')}
        >
          <History className="h-5 w-5" />
          <span className="text-xs mt-1">History</span>
        </button>
        
        {sourceLanguage && targetLanguage && sendMessage ? (
          <VisualTranslation
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onTextCapture={(originalText) => {
              if (originalText && sendMessage) {
                sendMessage(originalText);
                navigate('/'); // Navigate to home/chat after capture
              }
            }}
          >
            <div className="flex flex-col items-center justify-center p-2 w-1/5 h-full text-muted-foreground">
              <Camera className="h-5 w-5" />
              <span className="text-xs mt-1">Camera</span>
            </div>
          </VisualTranslation>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 w-1/5 h-full text-muted-foreground">
            <Camera className="h-5 w-5" />
            <span className="text-xs mt-1">Camera</span>
          </div>
        )}
        
        <button
          className={`flex flex-col items-center justify-center p-2 w-1/5 h-full ${
            isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Settings</span>
        </button>
        
        {isAuthenticated && (
          <button
            className={`flex flex-col items-center justify-center p-2 w-1/5 h-full ${
              location === '/profile' ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => navigate('/profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        )}
        
        {!isAuthenticated && (
          <button
            className={`flex flex-col items-center justify-center p-2 w-1/5 h-full ${
              location === '/auth' ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => navigate('/auth')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Sign In</span>
          </button>
        )}
      </nav>
    </div>
  );
}