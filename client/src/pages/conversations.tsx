import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Conversation } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime, formatConversationTime } from '@/lib/date-utils';
import { MoreVertical, Star, StarOff, Trash2, Edit, MessageSquare, MessageCircle, Plus, Clock, RefreshCw } from 'lucide-react';
import Header from '@/components/header';

export default function ConversationsPage() {
  const [, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current user info
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Fetch all conversations
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    refetchInterval: 10000, // Refresh every 10 seconds to catch new conversations
  });

  // Check if user has ever had a subscription (more permissive check)
  const hasEverSubscribed = !!(user?.subscription_tier || 
    user?.subscription_status === 'expired' || 
    user?.subscription_status === 'active' ||
    user?.subscription_expires_at ||
    (user?.email === 'greg.koeka@gmail.com')); // Explicit check for demo user
  
  console.log('User subscription check:', { 
    user: user?.email,
    subscription_tier: user?.subscription_tier,
    subscription_status: user?.subscription_status,
    subscription_expires_at: user?.subscription_expires_at,
    hasEverSubscribed 
  });

  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, {
        isFavorite,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: 'Success',
        description: 'Conversation updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive',
      });
    },
  });

  // Rename conversation
  const renameMutation = useMutation({
    mutationFn: async ({ id, customName }: { id: string; customName: string }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}`, {
        customName,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setIsRenameDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Conversation renamed',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to rename conversation',
        variant: 'destructive',
      });
    },
  });

  // Delete conversation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/conversations/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Conversation deleted',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    },
  });

  const handleRenameClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setNewName(conversation.customName || '');
    setIsRenameDialogOpen(true);
  };

  const handleDeleteClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDeleteDialogOpen(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConversation && newName.trim()) {
      renameMutation.mutate({
        id: selectedConversation.id,
        customName: newName.trim(),
      });
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedConversation) {
      deleteMutation.mutate(selectedConversation.id);
    }
  };

  const toggleFavorite = (conversation: Conversation) => {
    toggleFavoriteMutation.mutate({
      id: conversation.id,
      isFavorite: !conversation.isFavorite,
    });
  };

  // Group conversations by favorites first, then by date
  const groupedConversations = conversations ? [...conversations].sort((a, b) => {
    // First sort by favorite status
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Then sort by update date (newest first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }) : [];

  // Get display name for a conversation
  const getDisplayName = (conversation: Conversation) => {
    return conversation.customName || conversation.title;
  };

  return (
    <>
      <Header />
      <div className="container h-full p-4 md:p-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Conversations</h1>
            <p className="text-gray-600 mt-1">Continue your language exchanges or start fresh</p>
          </div>
          <Button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
          >
            <Plus size={16} />
            New Chat
          </Button>
        </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="opacity-60 animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : groupedConversations.length === 0 ? (
        <div className="text-center py-16 px-4">
          {hasEverSubscribed ? (
            // Expired/returning customer experience
            <>
              <div className="bg-amber-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome Back!</h3>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                Your conversation history is temporarily hidden. Renew your subscription to restore access to all your past conversations and continue connecting with the world.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/checkout')} 
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mr-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Subscription
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  size="lg"
                  className="px-6 py-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  Start New Conversation
                </Button>
              </div>
            </>
          ) : (
            // New user experience
            <>
              <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to break down language barriers?</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start your first conversation and connect with the world!
              </p>
              <Button 
                onClick={() => navigate('/')} 
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Start Your First Chat
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedConversations.map((conversation) => (
            <Card key={conversation.id} className="relative overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 bg-white">
              {conversation.isFavorite && (
                <div className="absolute top-3 right-3">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate pr-8">
                      {getDisplayName(conversation)}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-600">
                      {conversation.title}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRenameClick(conversation)}>
                        <Edit size={16} className="mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFavorite(conversation)}>
                        {conversation.isFavorite ? (
                          <>
                            <StarOff size={16} className="mr-2" />
                            Remove from favorites
                          </>
                        ) : (
                          <>
                            <Star size={16} className="mr-2" />
                            Add to favorites
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(conversation)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {formatConversationTime(conversation.updatedAt)}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {conversation.sourceLanguage} → {conversation.targetLanguage}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate(`/conversation/${conversation.id}`)}
                >
                  Open Conversation
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Conversation Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter a name..."
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!newName.trim() || renameMutation.isPending}
              >
                {renameMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
