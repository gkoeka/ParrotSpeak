import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return React.createElement(
    View,
    { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' } },
    React.createElement(
      Text,
      { style: { fontSize: 24, color: '#fff', textAlign: 'center' } },
      '🦜 ParrotSpeak Mobile Test'
    )
  );
}