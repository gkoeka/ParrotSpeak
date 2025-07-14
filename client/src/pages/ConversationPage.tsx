import React from 'react';
import { Link } from 'wouter';

export default function ConversationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Voice Translation</h1>
          <p className="text-gray-600 mb-6">
            ParrotSpeak's voice translation features are optimized for mobile devices.
          </p>
          <Link href="/mobile-app-preview">
            <a className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Try Mobile Version
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}