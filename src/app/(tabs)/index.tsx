import { useLedger } from '@/features/ledger/useLedger';
import { SocietyRequired } from '@/features/societies/SocietyRequired';
import { SocietySwitcher } from '@/features/societies/SocietySwitcher';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, Sparkles, UserCircle2, Wallet } from 'lucide-react-native';
import React, { memo } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TransactionItem = memo(({ item }: { item: any }) => (
  <TouchableOpacity 
    activeOpacity={0.7}
    className="bg-white p-5 rounded-[24px] mb-4 flex-row items-center shadow-sm border border-slate-50"
  >
    <View className={`p-4 rounded-2xl mr-4 ${
      item.type === 'credit' ? 'bg-success/10' : 'bg-danger/10'
    }`}>
      {item.type === 'credit' ? (
        <ArrowDownLeft size={22} color="#22c55e" />
      ) : (
        <ArrowUpRight size={22} color="#ef4444" />
      )}
    </View>
    <View className="flex-1">
      <Text className="font-bold text-slate-800 text-[17px] mb-0.5">
        {item.type === 'credit' ? 'Payment Received' : 'Expense Paid'}
      </Text>
      <Text className="text-slate-400 text-xs font-medium">
        {format(new Date(item.created_at), 'MMM dd • hh:mm a')}
      </Text>
    </View>
    <View className="items-end">
      <Text className={`font-black text-[17px] ${
        item.type === 'credit' ? 'text-success' : 'text-danger'
      }`}>
        {item.type === 'credit' ? '+' : '-'} {item.amount.toLocaleString()}
      </Text>
      <ChevronRight size={14} color="#cbd5e1" />
    </View>
  </TouchableOpacity>
));

const QuickStat = memo(({ title, amount, color, icon: Icon }: any) => (
  <View className="flex-1 px-2">
    <View className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-50">
      <View className={`${color} w-10 h-10 rounded-2xl items-center justify-center mb-3`}>
        <Icon size={20} color="white" />
      </View>
      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
        {title}
      </Text>
      <Text className="text-[16px] font-black text-slate-800" numberOfLines={1}>
        {amount.toLocaleString()}
      </Text>
    </View>
  </View>
));

export default function DashboardScreen() {
  const { activeSociety } = useSocietyStore();
  const { profile } = useAuthStore();
  const { ledger, stats, isLoadingStats, refresh } = useLedger();

  if (!activeSociety) {
    return <SocietyRequired title="Dashboard" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoadingStats} onRefresh={refresh} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="px-6 pt-4 pb-8 bg-white">
          <View className="flex-row items-center mb-8">
            <View className="bg-primary/10 p-3 rounded-2xl mr-3">
              <UserCircle2 size={22} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">Welcome Back</Text>
              <Text className="text-3xl font-black text-slate-900">{profile?.name || 'Member'}</Text>
            </View>
            <View className="bg-slate-100 px-3 py-2 rounded-xl">
              <Text className="text-slate-500 text-[10px] font-black uppercase">Dashboard</Text>
            </View>
          </View>

          <SocietySwitcher />
        </View>

        {/* Profile + Balance Card */}
        <View className="px-6 -mt-4">
          <View className="bg-primary p-8 rounded-[40px] shadow-2xl shadow-primary/40 relative overflow-hidden mb-4">
            <View className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
            <View className="absolute -left-10 -bottom-10 w-20 h-20 bg-white/5 rounded-full" />
            
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="bg-white/20 p-2 rounded-lg">
                  <Wallet size={18} color="white" />
                </View>
                <Text className="text-white/70 font-black ml-3 uppercase tracking-[2px] text-[10px]">
                  Current Society Balance
                </Text>
              </View>
              <View className="flex-row items-center">
                <Sparkles size={14} color="#fff" />
                <Text className="text-white/80 text-[10px] font-black ml-1 uppercase">Live</Text>
              </View>
            </View>
            
            <View className="flex-row items-baseline">
              <Text className="text-white/60 text-lg font-bold mr-2">PKR</Text>
              <Text className="text-5xl font-black text-white tracking-tighter">
                {stats.balance.toLocaleString()}
              </Text>
            </View>

            <View className="mt-6 bg-white/10 rounded-2xl p-4">
              <Text className="text-white/70 text-[10px] uppercase font-black tracking-[2px]">You are viewing</Text>
              <Text className="text-white text-base font-black mt-1">{activeSociety?.name}</Text>
            </View>
          </View>

          <View className="bg-slate-900 p-5 rounded-[28px] shadow-xl shadow-slate-900/15">
            <Text className="text-white/50 text-[10px] uppercase font-black tracking-[2px]">Public Audit Promise</Text>
            <Text className="text-white text-sm mt-2 leading-5">
              Every approved contribution and expense is visible in history. Members can now add audit comments on each entry.
            </Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View className="flex-row px-4 mt-8">
          <QuickStat 
            title="Total Income" 
            amount={stats.totalReceived} 
            color="bg-success" 
            icon={ArrowDownLeft} 
          />
          <QuickStat 
            title="Total Spent" 
            amount={stats.totalSpent} 
            color="bg-danger" 
            icon={ArrowUpRight} 
          />
        </View>

        {/* Transactions Header */}
        <View className="px-6 mt-10 mb-6 flex-row justify-between items-end">
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">Recent Activity</Text>
            <Text className="text-slate-400 text-xs font-bold mt-1">Latest 5 transactions</Text>
          </View>
          <TouchableOpacity>
            <Text className="text-primary font-black text-sm border-b-2 border-primary/20 pb-1">History Tab</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        <View className="px-6">
          {ledger.slice(0, 5).map((item: any) => (
            <TransactionItem key={item.id} item={item} />
          ))}

          {ledger.length === 0 && (
            <View className="items-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
              <View className="bg-white p-6 rounded-full shadow-sm mb-4">
                <Clock size={40} color="#cbd5e1" />
              </View>
              <Text className="text-slate-400 font-bold text-lg">
                No history yet
              </Text>
              <Text className="text-slate-300 text-sm mt-1">Transactions will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
