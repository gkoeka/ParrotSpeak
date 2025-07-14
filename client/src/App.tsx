import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import HomePage from './pages/HomePage';
import ConversationPage from './pages/ConversationPage';
import ConversationsListPage from './pages/ConversationsListPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './contexts/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/conversations" component={ConversationsListPage} />
            <Route path="/conversation/:id?" component={ConversationPage} />
            <Route path="/analytics" component={AnalyticsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              </div>
            </Route>
          </Switch>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;