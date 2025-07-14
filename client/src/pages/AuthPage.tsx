import React from 'react';
import { Link } from 'wouter';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
            🦜
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ParrotSpeak</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>
        
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Web App Available</h2>
          <p className="text-gray-600 mb-4">
            ParrotSpeak is primarily designed as a mobile application for the best voice translation experience.
          </p>
          <Link href="/mobile-app-preview">
            <a className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Preview Mobile App
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}