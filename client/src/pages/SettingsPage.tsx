import React from 'react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">App Preferences</h2>
          <p className="text-gray-600">
            Settings and preferences will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}