import { SocietySwitcher } from '@/features/societies/SocietySwitcher';
import { Building2 } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

export const SocietyRequired = ({ title }: { title: string }) => {
  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">
        Society
      </Text>
      <Text className="text-4xl font-black text-slate-900 mb-6">{title}</Text>

      <View className="bg-slate-50/70 border border-slate-100 rounded-[32px] p-8 items-center">
        <View className="bg-primary/10 p-5 rounded-[24px] mb-4">
          <Building2 size={36} color="#10b981" />
        </View>
        <Text className="text-slate-800 font-black text-lg mb-2">
          Select a society first
        </Text>
        <Text className="text-slate-400 text-center mb-6">
          Society features are available after you choose or join a society.
        </Text>
        <View className="w-full">
          <SocietySwitcher />
        </View>
      </View>
    </View>
  );
};
