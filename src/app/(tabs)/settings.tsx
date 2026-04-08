import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { Image } from 'expo-image';
import { Bell, ChevronRight, Info, LogOut, Shield, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { user, profile, setProfile, signOut } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.name || '');
  }, [profile?.name]);

  const handleSignOut = async () => {
    const performSignOut = async () => {
      try {
        await signOut();
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        await performSignOut();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: performSignOut },
      ]
    );
  };

  const SettingItem = ({ icon: Icon, title, onPress, color = 'text-slate-800', subtitle }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center p-6 border-b border-slate-50 last:border-b-0 active:bg-slate-50"
    >
      <View className="bg-slate-100 p-3 rounded-2xl mr-4">
        <Icon size={20} color={color === 'text-danger' ? '#ef4444' : '#64748b'} />
      </View>
      <View className="flex-1">
        <Text className={`font-black text-base uppercase tracking-tight ${color}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-widest">{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: displayName.trim() })
        .eq('id', user?.id)
        .select('*')
        .single();

      if (error) throw error;
      setProfile(data);
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-16 pb-8">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">Account</Text>
        <Text className="text-4xl font-black text-slate-900">Settings</Text>
      </View>

      <View className="px-6">
        {/* Profile Card */}
        <View className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-900/20 mb-10 overflow-hidden relative">
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
          <View className="flex-row items-center">
            <View className="w-20 h-20 rounded-[30px] items-center justify-center overflow-hidden bg-white/10 border-2 border-white/20">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-full h-full"
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <User size={32} color="white" />
              )}
            </View>
            <View className="ml-6 flex-1">
              <Text className="text-2xl font-black text-white leading-tight">
                {profile?.name || 'Society Member'}
              </Text>
              <Text className="text-white/50 text-xs font-bold mt-1 uppercase tracking-widest">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Menu */}
        <Text className="text-2xl font-black text-slate-900 mb-6 px-1 tracking-tight">User Profile</Text>
        <View className="bg-white rounded-[32px] p-5 shadow-xl shadow-slate-100 border border-slate-50 mb-8">
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={savingProfile}
          />
        </View>

        <Text className="text-2xl font-black text-slate-900 mb-6 px-1 tracking-tight">Preferences</Text>
        <View className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-100 border border-slate-50 mb-10">
          <SettingItem icon={User} title="Personal Info" subtitle="Update your profile" />
          <SettingItem icon={Bell} title="Notifications" subtitle="Alerts & messaging" />
          <SettingItem icon={Shield} title="Privacy & Security" subtitle="Password & sessions" />
          <SettingItem icon={Info} title="About Ledger" subtitle="App info & support" />
        </View>

        {/* Danger Zone */}
        <View className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-100 border border-slate-50 mb-20">
          <SettingItem 
            icon={LogOut} 
            title="Sign Out" 
            onPress={handleSignOut}
            color="text-danger"
            subtitle="Securely end session"
          />
        </View>

        <Text className="text-center text-slate-300 font-black uppercase text-[10px] tracking-[4px] mb-12">
          Society Ledger v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
