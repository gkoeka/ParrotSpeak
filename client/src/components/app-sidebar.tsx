import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { MessageCircle, History, User, Search, Star, Settings, Plus, Smartphone, LogIn, LogOut, MessageSquare } from 'lucide-react';
import { formatConversationTime } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useMobile } from '@/hooks/use-mobile';
import { useAuthContext } from '@/providers/auth-provider';
import { Conversation } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface AppSidebarProps {
  conversations?: Conversation[];
  isLoading?: boolean;
}

export default function AppSidebar({ conversations = [], isLoading = false }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useMobile();
  const { user, isAuthenticated, logout } = useAuthContext();
  
  // Check if running in mobile iframe
  const isInMobileFrame = window.location.search.includes('mobile=true');
  
  // Enhanced navigation function that preserves mobile context
  const enhancedNavigate = (path: string) => {
    if (isInMobileFrame) {
      navigate(`${path}${path.includes('?') ? '&' : '?'}mobile=true`);
    } else {
      navigate(path);
    }
  };
  
  const filteredConversations = conversations.filter(conv => {
    const searchText = search.toLowerCase();
    const title = (conv.customName || conv.title).toLowerCase();
    return title.includes(searchText);
  });
  
  const isActive = (path: string) => location === path;
  
  const handleConversationClick = (id: string) => {
    enhancedNavigate(`/conversation/${id}`);
    if (isMobile) {
      setSheetOpen(false);
    }
  };
  
  const handleNewChat = () => {
    enhancedNavigate('/');
    if (isMobile) {
      setSheetOpen(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !conversation.isFavorite }),
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getDisplayName = (conversation: Conversation) => {
    return conversation.customName || conversation.title;
  };

  const getTime = (timestamp: string) => {
    return formatConversationTime(timestamp);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl font-bold">Parrot Speak</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => enhancedNavigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="px-4 mb-3">
        <Button 
          variant="default" 
          className="w-full flex justify-center items-center gap-2 py-6 text-lg font-medium"
          onClick={handleNewChat}
        >
          <Plus className="h-5 w-5" />
          <span>New Conversation</span>
        </Button>
      </div>
      
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`flex items-start p-3 gap-3 cursor-pointer rounded-md ${isActive(`/conversation/${conversation.id}`) ? 'bg-accent' : 'hover:bg-muted'}`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm truncate">{getDisplayName(conversation)}</h3>
                    <span className="text-xs text-muted-foreground">{getTime(conversation.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-muted-foreground truncate">
                      {conversation.sourceLanguage} → {conversation.targetLanguage}
                    </div>
                    {conversation.isFavorite && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {search ? 'No conversations found' : 'No conversations yet'}
          </div>
        )}
      </div>
      
      <Separator />

      {/* User account information */}
      <div className="p-4">
        {isAuthenticated ? (
          <div className="bg-muted rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user?.username || user?.email}</div>
                {user?.email && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2"
              onClick={() => {
                logout();
                enhancedNavigate('/auth');
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="mb-3">
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2"
              onClick={() => enhancedNavigate('/auth')}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In / Register</span>
            </Button>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="p-2">
        <nav className="flex justify-around items-end min-h-[60px]">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => enhancedNavigate('/')}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs mt-1">Chat</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-1 ${isActive('/conversations') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => enhancedNavigate('/conversations')}
          >
            <History className="h-4 w-4" />
            <span className="text-xs mt-1">History</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-1 ${isActive('/settings') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => enhancedNavigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs mt-1">Settings</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-1 ${isActive('/settings') && window.location.search.includes('tab=feedback') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => enhancedNavigate('/settings?tab=feedback')}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs mt-1">Feedback</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center p-1 ${isActive('/mobile-preview') ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => enhancedNavigate('/mobile-preview')}
          >
            <Smartphone className="h-4 w-4" />
            <span className="text-xs mt-1">Preview</span>
          </Button>
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center p-2 ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => enhancedNavigate('/profile')}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Button>
          )}
        </nav>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:block h-screen w-[280px] border-r bg-background">
      {sidebarContent}
    </div>
  );
}
