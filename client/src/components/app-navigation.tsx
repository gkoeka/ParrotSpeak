import { MessageCircle, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function AppNavigation() {
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'profile'>('chat');
  const [location, navigate] = useLocation();
  
  // Update active tab based on current location
  useEffect(() => {
    if (location === "/") {
      setActiveTab('chat');
    } else if (location === "/conversations") {
      setActiveTab('history');
    } else if (location.startsWith("/conversation/")) {
      setActiveTab('chat');
    } else if (location === "/profile") {
      setActiveTab('profile');
    }
  }, [location]);
  
  const handleTabClick = (tab: 'chat' | 'history' | 'profile') => {
    setActiveTab(tab);
    
    if (tab === 'chat') {
      navigate('/');
    } else if (tab === 'history') {
      navigate('/conversations');
    } else if (tab === 'profile') {
      navigate('/profile');
    }
  };
  
  return (
    <nav className="px-4 py-3 bg-white border-t border-neutral-100 flex items-center justify-around">
      <Button
        variant="ghost"
        className={`flex flex-col items-center p-2 ${
          activeTab === 'chat' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-700'
        }`}
        onClick={() => handleTabClick('chat')}
      >
        <MessageCircle className="h-5 w-5" />
        <span className={`text-xs mt-1 ${activeTab === 'chat' ? 'font-medium' : ''}`}>Chat</span>
      </Button>
      
      <Button
        variant="ghost"
        className={`flex flex-col items-center p-2 ${
          activeTab === 'history' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-700'
        }`}
        onClick={() => handleTabClick('history')}
      >
        <History className="h-5 w-5" />
        <span className={`text-xs mt-1 ${activeTab === 'history' ? 'font-medium' : ''}`}>History</span>
      </Button>
      
      <Button
        variant="ghost"
        className={`flex flex-col items-center p-2 ${
          activeTab === 'profile' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-700'
        }`}
        onClick={() => handleTabClick('profile')}
      >
        <User className="h-5 w-5" />
        <span className={`text-xs mt-1 ${activeTab === 'profile' ? 'font-medium' : ''}`}>Profile</span>
      </Button>
    </nav>
  );
}
