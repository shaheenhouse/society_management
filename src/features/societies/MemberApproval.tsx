import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSocieties } from './useSocieties';
import { UserCheck, UserX, Clock } from 'lucide-react-native';

export const MemberApproval = () => {
  const { fetchPendingMembers, manageMember } = useSocieties();
  const { data: pendingMembers, isLoading, refetch } = fetchPendingMembers;

  const handleAction = async (memberId: string, status: 'active' | 'removed', name: string) => {
    const actionText = status === 'active' ? 'approve' : 'reject';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionText} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.toUpperCase(),
          style: status === 'active' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await manageMember.mutateAsync({ memberId, status });
              Alert.alert('Success', `Member ${actionText}ed successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (!pendingMembers || pendingMembers.length === 0) {
    return (
      <Card className="items-center py-8">
        <Clock size={40} color="#cbd5e1" />
        <Text className="text-slate-400 mt-4 text-center font-medium">
          No pending membership requests
        </Text>
      </Card>
    );
  }

  return (
    <View>
      <Text className="text-xl font-bold text-slate-800 mb-4 px-1">
        Membership Requests
      </Text>
      {pendingMembers.map((item: any) => (
        <Card key={item.id} className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-bold text-lg text-slate-800">
                {item.profiles?.name || 'Unknown User'}
              </Text>
              <Text className="text-slate-500 text-sm">
                Wants to join: {item.societies?.name}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleAction(item.id, 'removed', item.profiles?.name)}
                className="bg-danger/10 p-3 rounded-xl"
              >
                <UserX size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAction(item.id, 'active', item.profiles?.name)}
                className="bg-success/10 p-3 rounded-xl"
              >
                <UserCheck size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
};