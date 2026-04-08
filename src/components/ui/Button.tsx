import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return 'bg-primary';
      case 'secondary': return 'bg-secondary';
      case 'danger': return 'bg-danger';
      case 'outline': return 'border border-primary bg-transparent';
      default: return 'bg-primary';
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') return 'text-primary';
    return 'text-white';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={{ pointerEvents: disabled || loading ? 'none' : 'auto' }}
      className={`p-4 rounded-xl flex-row justify-center items-center ${getVariantStyles()} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#10b981' : 'white'} />
      ) : (
        <Text className={`font-semibold text-lg ${getTextStyle()}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
