import React from 'react';

export default function ConversationsListPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Conversations</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">
            Your conversation history will appear here. Start a new conversation to begin.
          </p>
        </div>
      </div>
    </div>
  );
}