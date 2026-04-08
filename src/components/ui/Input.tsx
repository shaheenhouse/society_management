import React from 'react';
import { View, TextInput, Text } from 'react-native';

interface InputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
}

export const Input = ({
  label,
  error,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  className = '',
}: InputProps) => {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-slate-600 font-medium mb-1 ml-1">
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className={`bg-white border ${error ? 'border-danger' : 'border-slate-200'} p-4 rounded-xl text-lg text-slate-800 focus:border-primary`}
      />
      {error && (
        <Text className="text-danger text-sm mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
};
