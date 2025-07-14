import React from 'react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">User Profile</h2>
          <p className="text-gray-600">
            Profile information and account settings will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}