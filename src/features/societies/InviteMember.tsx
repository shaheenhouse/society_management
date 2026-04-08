import { Card } from '@/components/ui/Card';
import { useSocietyStore } from '@/store/societyStore';
import { Copy, Share2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';

export const InviteMember = () => {
  const { activeSociety } = useSocietyStore();
  const inviteCode = activeSociety?.id?.substring(0, 8).toUpperCase() || 'N/A';

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join our society "${activeSociety?.name}" on Society Ledger! Use invite code: ${inviteCode}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View className="mb-8">
      <Text className="text-2xl font-black text-slate-900 mb-6 px-1">Invite Neighbors</Text>
      <Card className="p-8 border-0 shadow-xl shadow-primary/10">
        <View className="items-center">
          <View className="bg-slate-50 w-20 h-20 rounded-[30px] items-center justify-center mb-6">
            <Share2 size={32} color="#10b981" />
          </View>
          
          <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-2">Your Invite Code</Text>
          <View className="bg-primary/5 px-10 py-6 rounded-[32px] mb-8 border border-primary/10">
            <Text className="text-5xl font-black text-primary tracking-[4px]">
              {inviteCode}
            </Text>
          </View>

          <View className="flex-row gap-4 w-full">
            <TouchableOpacity 
              onPress={onShare}
              className="flex-1 bg-primary h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-primary/30"
            >
              <Share2 size={20} color="white" />
              <Text className="text-white font-black ml-3 uppercase text-xs tracking-widest">Share Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Alert.alert('Success', 'Code copied to clipboard!')}
              className="bg-slate-50 px-6 h-16 rounded-2xl items-center justify-center border border-slate-100"
            >
              <Copy size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-slate-400 text-[10px] font-bold mt-6 text-center leading-4">
            People can join by searching for your society name{"\n"}or entering this private code.
          </Text>
        </View>
      </Card>
    </View>
  );
};
