import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useEvents } from '@/features/events/useEvents';
import { useSocieties } from '@/features/societies/useSocieties';
import { useSocietyStore } from '@/store/societyStore';
import { CalendarHeart, Megaphone, Target } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

export const EventsPanel = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const { activeSociety } = useSocietyStore();
  const { data: societies } = useSocieties();
  const { data: events, createEvent, isLoading } = useEvents();

  const roleId = useMemo(
    () => societies?.find((society: any) => society.id === activeSociety?.id)?.role_id,
    [societies, activeSociety?.id]
  );
  const canManageEvents = [1, 2, 3].includes(roleId);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter event title');
      return;
    }
    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        targetAmount: targetAmount ? Number(targetAmount) : undefined,
      });
      setTitle('');
      setDescription('');
      setTargetAmount('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to create event');
    }
  };

  return (
    <View className="mt-4">
      <View className="flex-row items-center mb-4">
        <CalendarHeart size={18} color="#10b981" />
        <Text className="text-slate-900 text-xl font-black ml-2">Events & Fundraising</Text>
      </View>

      {canManageEvents && (
        <Card className="mb-4">
          <Text className="font-black text-slate-800 mb-4">Create New Event</Text>
          <Input label="Event Title" value={title} onChangeText={setTitle} placeholder="Solar Plant Fundraiser" />
          <Input label="Target Amount (PKR)" value={targetAmount} onChangeText={setTargetAmount} keyboardType="numeric" placeholder="500000" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Purpose, date and reminders..." />
          <Button title="Create Event" onPress={handleCreate} loading={createEvent.isPending} />
        </Card>
      )}

      {isLoading ? (
        <Card>
          <Text className="text-slate-400">Loading events...</Text>
        </Card>
      ) : events?.length ? (
        events.map((event: any) => {
          const raised = (event.event_contributions || []).reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0
          );
          const target = Number(event.target_amount || 0);
          const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

          return (
            <Card key={event.id} className="mb-3 border-l-4 border-l-primary">
              <View className="flex-row items-center justify-between">
                <Text className="font-black text-slate-800 text-lg flex-1">{event.title}</Text>
                <Megaphone size={16} color="#10b981" />
              </View>
              {event.description ? (
                <Text className="text-slate-500 text-xs mt-1">{event.description}</Text>
              ) : null}

              <View className="mt-3 bg-slate-50 p-3 rounded-xl">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase">Raised</Text>
                  <Text className="text-slate-700 text-xs font-bold">PKR {raised.toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Target size={12} color="#94a3b8" />
                    <Text className="text-slate-400 text-[10px] font-black uppercase ml-1">Target</Text>
                  </View>
                  <Text className="text-slate-700 text-xs font-bold">
                    {target > 0 ? `PKR ${target.toLocaleString()} • ${progress}%` : 'Not set'}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })
      ) : (
        <Card className="items-center py-8">
          <Text className="text-slate-400">No events yet in this society.</Text>
        </Card>
      )}
    </View>
  );
};
