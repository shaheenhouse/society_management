import { supabase } from '@/api/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, Database, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  
  // Database connection status states
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setDbStatus('checking');
    try {
      // Simple query to check if we can reach the database
      const { data, error } = await supabase.from('roles').select('id').limit(1);
      
      if (error) throw error;
      setDbStatus('connected');
      setDbError(null);
    } catch (err: any) {
      console.error('Database connection error:', err);
      setDbStatus('error');
      setDbError(err.message || 'Could not connect to Supabase');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-10 items-center">
            <Text className="text-4xl font-bold text-primary mb-2 tracking-tight">
              Society Ledger
            </Text>
            <Text className="text-slate-500 text-center text-base">
              Transparent financial tracking for your community
            </Text>
          </View>

          <View className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
            {/* Database Connectivity Indicator */}
            <View className="mb-8 items-center flex-row justify-center bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              {dbStatus === 'checking' && (
                <>
                  <Database size={16} color="#94a3b8" />
                  <Text className="text-slate-500 text-[10px] font-bold ml-2 tracking-widest uppercase">Checking Connection...</Text>
                </>
              )}
              {dbStatus === 'connected' && (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <Text className="text-success text-[10px] font-bold ml-2 tracking-widest uppercase">Database Connected</Text>
                </>
              )}
              {dbStatus === 'error' && (
                <View className="items-center">
                  <View className="flex-row items-center">
                    <XCircle size={16} color="#ef4444" />
                    <Text className="text-danger text-[10px] font-bold ml-2 tracking-widest uppercase">Connection Failed</Text>
                  </View>
                  <Text className="text-danger/70 text-[10px] mt-1 text-center" numberOfLines={1}>
                    {dbError || 'Check your internet or Supabase URL'}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-3xl font-bold text-slate-800 mb-8 text-center">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            {isSignUp && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                className="mb-6"
              />
            )}

            <Input
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-6"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="mb-8"
            />

            <Button
              title={isSignUp ? 'Create Account' : 'Sign In'}
              onPress={handleAuth}
              loading={loading}
              className="h-16 rounded-2xl"
            />

            <View className="flex-row justify-center items-center mt-10 flex-wrap">
              <Text className="text-slate-500 text-base">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => setIsSignUp(!isSignUp)}
                activeOpacity={0.7}
                className="py-2 px-1"
              >
                <Text className="text-primary font-bold text-base border-b border-primary/30">
                  {isSignUp ? 'Login' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
