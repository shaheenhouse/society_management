import { Card } from '@/components/ui/Card';
import { EventsPanel } from '@/features/events/EventsPanel';
import { InviteMember } from '@/features/societies/InviteMember';
import { SocietyManagementDashboard } from '@/features/societies/SocietyManagementDashboard';
import { SocietyRequired } from '@/features/societies/SocietyRequired';
import { SocietySwitcher } from '@/features/societies/SocietySwitcher';
import { useSocieties } from '@/features/societies/useSocieties';
import { useSocietyStore } from '@/store/societyStore';
import { Building2, Shield } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function SocietyScreen() {
  const { activeSociety } = useSocietyStore();
  const { data: societies } = useSocieties();

  const roleId = useMemo(
    () => societies?.find((society: any) => society.id === activeSociety?.id)?.role_id,
    [societies, activeSociety?.id]
  );
  const canManage = [1, 2, 3].includes(roleId);

  if (!activeSociety) {
    return <SocietyRequired title="Society" />;
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="px-6 pt-12 pb-4">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">Society Workspace</Text>
        <Text className="text-4xl font-black text-slate-900">Society</Text>
      </View>

      <View className="px-6">
        <SocietySwitcher />

        <Card className="mt-5 bg-primary border-0 p-6 rounded-[32px]">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-3 rounded-2xl mr-3">
              <Building2 size={22} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-[10px] font-black uppercase tracking-[2px]">Active Society</Text>
              <Text className="text-white text-2xl font-black">{activeSociety.name}</Text>
            </View>
          </View>
          <Text className="text-white/80 text-xs mt-4">
            {activeSociety.description || 'Community contributions, audit and transparent governance.'}
          </Text>
        </Card>

        <InviteMember />

        {canManage ? (
          <View className="mt-2">
            <View className="flex-row items-center mb-3">
              <Shield size={18} color="#10b981" />
              <Text className="text-slate-900 text-xl font-black ml-2">Manage Society</Text>
            </View>
            <SocietyManagementDashboard />
          </View>
        ) : (
          <Card className="mt-4">
            <Text className="text-slate-500 text-sm">
              You are a member of this society. Management actions are available to Admins and Finance Managers.
            </Text>
          </Card>
        )}

        <EventsPanel />
      </View>
    </ScrollView>
  );
}
