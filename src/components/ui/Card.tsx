import React from 'react';
import { Text, View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Card = ({ children, title, subtitle, className = '' }: CardProps) => {
  return (
    <View className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 ${className}`}>
      {(title || subtitle) && (
        <View className="mb-4">
          {title && (
            <Text className="text-xl font-bold text-slate-800">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-slate-500 text-sm">
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
};
