import React from 'react';
import { View, Text } from 'react-native';

interface ParrotSpeakLogoProps {
  width?: number;
  height?: number;
  style?: any;
}

export default function ParrotSpeakLogo({ 
  width = 35, 
  height = 35, 
  style 
}: ParrotSpeakLogoProps) {
  return (
    <View 
      style={[
        {
          width: width,
          height: height,
          backgroundColor: '#4ade80',
          borderRadius: width / 2,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#1f2937',
        },
        style
      ]}
    >
      <Text style={{
        fontSize: width * 0.4,
        fontWeight: 'bold',
        color: 'white',
      }}>
        🦜
      </Text>
    </View>
  );
}