import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSocietyStore } from '@/store/societyStore';
import { Check, ChevronDown, Globe, Lock, Plus, Search, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSocieties } from './useSocieties';

export const SocietySwitcher = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const { societies, activeSociety, setActiveSociety } = useSocietyStore();
  const { createSociety, joinSocietyByCode, searchPublicSocieties, joinSocietyById } = useSocieties();

  useEffect(() => {
    if (searchTerm.length > 2) {
      const delaySearch = setTimeout(async () => {
        try {
          const results = await searchPublicSocieties.mutateAsync(searchTerm);
          setSearchResults(results || []);
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 500);
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      const society = await createSociety.mutateAsync({ name, description, isPrivate });
      setActiveSociety(society);
      setCreateModalVisible(false);
      resetCreateForm();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
  };

  const handleJoinByCode = async () => {
    if (!inviteCode) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      // Allow accepting direct invites too
      const society = await joinSocietyByCode.mutateAsync(inviteCode);
      Alert.alert('Success', `Joined/Requested "${society.name}".`);
      setJoinModalVisible(false);
      setInviteCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleJoinById = async (societyId: string, societyName: string) => {
    try {
      await joinSocietyById.mutateAsync(societyId);
      Alert.alert('Success', `Requested to join "${societyName}". Please wait for admin approval.`);
      setJoinModalVisible(false);
      setSearchTerm('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        className="flex-row items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
      >
        <View className="bg-primary/10 p-2 rounded-xl mr-3">
          <Users size={20} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Current Society
          </Text>
          <Text className="text-slate-800 font-bold text-base">
            {activeSociety?.name || 'Select Society'}
          </Text>
        </View>
        <ChevronDown size={20} color="#64748b" />
      </TouchableOpacity>

      {/* Society List Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] p-8 max-h-[85%] shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-100 rounded-full self-center mb-8" />
            
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-3xl font-bold text-slate-800">
                  Societies
                </Text>
                <Text className="text-slate-400 text-sm mt-1">
                  Manage your communities
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setJoinModalVisible(true);
                  }}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-100"
                >
                  <Search size={22} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setCreateModalVisible(true);
                  }}
                  className="bg-primary p-3 rounded-2xl shadow-sm shadow-primary/40"
                >
                  <Plus size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={societies || []}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (item.status === 'pending') {
                      Alert.alert('Pending', 'Your request to join this society is still pending approval.');
                      return;
                    }
                    setActiveSociety(item);
                    setModalVisible(false);
                  }}
                  className={`flex-row items-center p-5 rounded-3xl mb-4 border-2 ${
                    activeSociety?.id === item.id ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50/50'
                  } ${item.status === 'pending' ? 'opacity-60' : ''}`}
                >
                  <View className={`p-3 rounded-2xl mr-4 ${
                    activeSociety?.id === item.id ? 'bg-primary' : 'bg-white border border-slate-100'
                  }`}>
                    <Users size={20} color={activeSociety?.id === item.id ? 'white' : '#64748b'} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className={`font-bold text-lg ${
                        activeSociety?.id === item.id ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        {item.name}
                      </Text>
                      {item.status === 'pending' && (
                        <View className="bg-amber-100 px-2 py-0.5 rounded-lg ml-2">
                          <Text className="text-amber-700 text-[9px] font-black uppercase">Pending</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                      {item.description || 'Community management'}
                    </Text>
                  </View>
                  {activeSociety?.id === item.id && (
                    <View className="bg-primary p-1 rounded-full">
                      <Check size={14} color="white" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              className="mt-6 py-4 items-center"
            >
              <Text className="text-slate-400 font-bold text-base">Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Society Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 p-6 justify-center">
          <View className="bg-white rounded-[40px] p-8 shadow-2xl">
            <Text className="text-3xl font-bold text-slate-800 mb-2">
              Discover
            </Text>
            <Text className="text-slate-400 mb-8">
              Find and join public societies or enter a private code
            </Text>
            
            <View className="bg-slate-50 rounded-2xl flex-row items-center px-4 mb-6 border border-slate-100">
              <Search size={20} color="#94a3b8" />
              <Input
                placeholder="Search societies..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 border-0 h-14"
              />
            </View>

            {searchTerm.length > 0 ? (
              <View className="max-h-60 mb-6">
                {searchPublicSocieties.isPending ? (
                  <ActivityIndicator color="#10b981" />
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleJoinById(item.id, item.name)}
                        className="flex-row items-center p-4 bg-slate-50 rounded-2xl mb-2 border border-slate-100"
                      >
                        <Globe size={18} color="#10b981" />
                        <Text className="flex-1 ml-3 font-bold text-slate-700">{item.name}</Text>
                        <Text className="text-primary font-bold text-xs uppercase">Join</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text className="text-center text-slate-400 py-4 italic">No public societies found</Text>
                    }
                  />
                )}
              </View>
            ) : (
              <View className="mb-8">
                <View className="flex-row items-center mb-4">
                  <View className="h-[1px] flex-1 bg-slate-100" />
                  <Text className="mx-4 text-slate-300 font-bold text-xs uppercase tracking-widest">OR USE CODE</Text>
                  <View className="h-[1px] flex-1 bg-slate-100" />
                </View>
                
                <Input
                  label="Private Invite Code"
                  placeholder="e.g. 8A2B3C4D"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                />
                
                <Button
                  title="Join by Code"
                  onPress={handleJoinByCode}
                  loading={joinSocietyByCode.isPending}
                  className="mt-2"
                />
              </View>
            )}
            
            <TouchableOpacity 
              onPress={() => {
                setJoinModalVisible(false);
                setSearchTerm('');
              }}
              className="py-2 items-center"
            >
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Society Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-3xl font-bold text-slate-800">
                New Society
              </Text>
              <View className={`p-3 rounded-2xl ${isPrivate ? 'bg-amber-50' : 'bg-primary/5'}`}>
                {isPrivate ? <Lock size={22} color="#f59e0b" /> : <Globe size={22} color="#10b981" />}
              </View>
            </View>
            
            <Input
              label="Society Name"
              placeholder="e.g. Green Valley Residents"
              value={name}
              onChangeText={setName}
            />
            
            <Input
              label="Short Description"
              placeholder="e.g. Monthly maintenance and audit"
              value={description}
              onChangeText={setDescription}
            />

            <View className="flex-row items-center justify-between bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
              <View className="flex-1 mr-4">
                <Text className="font-bold text-slate-700 text-base">Private Society</Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Only people with invite code can join
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                thumbColor="white"
              />
            </View>

            <Button
              title="Create Community"
              onPress={handleCreate}
              loading={createSociety.isPending}
              className="h-16 rounded-2xl shadow-lg shadow-primary/40"
            />
            
            <TouchableOpacity 
              onPress={() => setCreateModalVisible(false)}
              className="mt-6 py-2 items-center"
            >
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
