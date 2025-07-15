import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageSquare, BarChart3, MessageCircle, Search, Eye, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  subscriptionStatus: string;
  subscriptionTier: string;
  createdAt: string;
  conversationCount: number;
}

interface UserDetails {
  user: AdminUser;
  conversations: any[];
  messageCount: number;
  totalConversations: number;
}

interface PlatformAnalytics {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  recentSignups: number;
  totalFeedback: number;
}

interface AdminFeedback {
  id: number;
  category: string;
  feedback: string;
  email: string;
  createdAt: string;
  userId: number;
  userEmail: string;
  username: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Check if user has admin access
  const isAdmin = user?.id === 1; // Admin user ID is 1

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch platform analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<PlatformAnalytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAdmin
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin
  });

  // Fetch all feedback
  const { data: feedback, isLoading: feedbackLoading } = useQuery<AdminFeedback[]>({
    queryKey: ["/api/admin/feedback"],
    enabled: isAdmin
  });

  // Search users
  const { data: searchResults } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users/search", searchQuery],
    enabled: isAdmin && searchQuery.length > 2
  });

  // Fetch user details when selected
  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: [`/api/admin/users/${selectedUser}`],
    enabled: isAdmin && selectedUser !== null
  });

  const handleUserSearch = (query: string) => {
    setSearchQuery(query);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionBadge = (status: string, tier: string) => {
    if (status === 'active') {
      return <Badge variant="default">{tier || 'Basic'}</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      bug: 'destructive',
      feature: 'default',
      translation: 'secondary',
      other: 'outline'
    } as const;
    return <Badge variant={variants[category as keyof typeof variants] || 'outline'}>{category}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.totalConversations || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.totalMessages || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.recentSignups || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? "..." : analytics?.totalFeedback || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Conversations</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : (
                        (searchQuery.length > 2 ? searchResults : users)?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.username || `${user.firstName} ${user.lastName}`.trim()}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {user.email}
                                {user.emailVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>{getSubscriptionBadge(user.subscriptionStatus, user.subscriptionTier)}</TableCell>
                            <TableCell>{user.conversationCount}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedUser(user.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>User Details: {user.email}</DialogTitle>
                                  </DialogHeader>
                                  <ScrollArea className="h-[60vh]">
                                    {userDetailsLoading ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                          <p className="text-muted-foreground">Loading user details...</p>
                                        </div>
                                      </div>
                                    ) : userDetails ? (
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h3 className="font-semibold mb-2">User Information</h3>
                                            <div className="space-y-2 text-sm">
                                              <div><strong>ID:</strong> {userDetails.user.id}</div>
                                              <div><strong>Email:</strong> {userDetails.user.email}</div>
                                              <div><strong>Username:</strong> {userDetails.user.username || 'Not set'}</div>
                                              <div><strong>Name:</strong> {userDetails.user.firstName || ''} {userDetails.user.lastName || ''}</div>
                                            </div>
                                          </div>
                                          <div>
                                            <h3 className="font-semibold mb-2">Activity</h3>
                                            <div className="space-y-2 text-sm">
                                              <div><strong>Conversations:</strong> {userDetails.totalConversations}</div>
                                              <div><strong>Messages:</strong> {userDetails.messageCount}</div>
                                              <div><strong>Joined:</strong> {formatDate(userDetails.user.createdAt)}</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h3 className="font-semibold mb-2">Recent Conversations</h3>
                                          <div className="space-y-2">
                                            {userDetails.conversations && userDetails.conversations.length > 0 ? (
                                              userDetails.conversations.slice(0, 10).map((conv) => (
                                                <div key={conv.id} className="border rounded p-3">
                                                  <div className="flex justify-between items-start">
                                                    <div>
                                                      <div className="font-medium">{conv.decryptedTitle || conv.title}</div>
                                                      <div className="text-sm text-muted-foreground">
                                                        {conv.sourceLanguage} → {conv.targetLanguage}
                                                      </div>
                                                      {conv.requiresAuthorization && (
                                                        <div className="text-xs text-amber-600 mt-1">
                                                          🔒 Authorization required to view encrypted content
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                      {formatDate(conv.createdAt)}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-muted-foreground text-center py-4">No conversations found</p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Authorization Request Section */}
                                        <div className="border-t pt-4">
                                          <h3 className="font-semibold mb-2">Request Data Access</h3>
                                          <p className="text-sm text-muted-foreground mb-3">
                                            Generate a secure authorization link to send manually via email.
                                          </p>
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => {
                                                // Generate authorization URL for manual sending
                                                const authUrl = `${window.location.origin}/admin-authorize?userid=${userDetails.user.id}`;
                                                navigator.clipboard.writeText(authUrl);
                                                toast({
                                                  title: "Authorization URL Copied",
                                                  description: "Send this secure link to the user via email to request access.",
                                                });
                                              }}
                                              variant="outline"
                                              size="sm"
                                            >
                                              📋 Copy Authorization URL
                                            </Button>
                                            
                                            {userDetails.user.adminAccessAuthorized && (
                                              <Button 
                                                onClick={async () => {
                                                  try {
                                                    await apiRequest("POST", "/api/admin/revoke-access", { 
                                                      userId: userDetails.user.id 
                                                    });
                                                    toast({
                                                      title: "Access Revoked",
                                                      description: "Admin access to encrypted data has been revoked.",
                                                    });
                                                    // Refresh the data
                                                    window.location.reload();
                                                  } catch (error) {
                                                    toast({
                                                      title: "Error",
                                                      description: "Failed to revoke access.",
                                                      variant: "destructive",
                                                    });
                                                  }
                                                }}
                                                variant="destructive"
                                                size="sm"
                                              >
                                                🚫 Revoke Access
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center py-8">
                                        <p className="text-muted-foreground">Failed to load user details</p>
                                      </div>
                                    )}
                                  </ScrollArea>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : (
                        feedback?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.username || item.userEmail || item.email}</div>
                                {item.userId && <div className="text-sm text-muted-foreground">ID: {item.userId}</div>}
                              </div>
                            </TableCell>
                            <TableCell>{getCategoryBadge(item.category)}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate">{item.feedback}</div>
                            </TableCell>
                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}