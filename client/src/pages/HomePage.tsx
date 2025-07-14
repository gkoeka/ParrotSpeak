import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!user) {
      setLocation('/auth');
    } else {
      setLocation('/conversation');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl">
            🦜
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ParrotSpeak
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Breaking down language barriers, one conversation at a time
          </p>
        </div>
        
        {user ? (
          <div className="space-y-4">
            <Link href="/conversation">
              <a className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Start Conversation
              </a>
            </Link>
            <div className="text-sm text-gray-500">
              Welcome back, {user.firstName || user.email}
            </div>
          </div>
        ) : (
          <Link href="/auth">
            <a className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}