import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

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
    <View style={style}>
      <Svg width={width} height={height} viewBox="0 0 100 100">
        {/* Background circle */}
        <Circle cx="50" cy="50" r="48" fill="white" stroke="#e5e7eb" strokeWidth="2" />
        
        {/* Parrot head - green */}
        <Path 
          d="M35 25 C20 25 15 35 15 50 C15 65 25 75 35 75 C40 75 45 70 45 65 L45 35 C45 30 40 25 35 25 Z" 
          fill="#4ade80" 
          stroke="#1f2937" 
          strokeWidth="2" 
        />
        
        {/* Parrot beak - yellow */}
        <Path 
          d="M45 40 C50 35 60 35 65 45 C60 50 50 50 45 45 Z" 
          fill="#fbbf24" 
          stroke="#1f2937" 
          strokeWidth="1.5" 
        />
        
        {/* Parrot eye */}
        <Circle cx="35" cy="40" r="3" fill="#1f2937" />
        <Circle cx="36" cy="39" r="1" fill="white" />
        
        {/* Speech bubble - teal */}
        <Circle cx="65" cy="65" r="18" fill="#14b8a6" stroke="#1f2937" strokeWidth="2" />
        <Path d="M50 75 L45 80 L50 70 Z" fill="#14b8a6" stroke="#1f2937" strokeWidth="1.5" />
        
        {/* Wing detail */}
        <Path 
          d="M25 45 C20 50 20 60 25 65 C30 60 30 50 25 45 Z" 
          fill="#059669" 
          stroke="#1f2937" 
          strokeWidth="1.5" 
        />
        
        {/* Speech bubble dots */}
        <Circle cx="60" cy="60" r="1.5" fill="white" />
        <Circle cx="65" cy="65" r="1.5" fill="white" />
        <Circle cx="70" cy="70" r="1.5" fill="white" />
      </Svg>
    </View>
  );
}