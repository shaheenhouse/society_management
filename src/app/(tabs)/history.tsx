import { useLedger } from '@/features/ledger/useLedger';
import { TransactionComments } from '@/features/comments/TransactionComments';
import { SocietyRequired } from '@/features/societies/SocietyRequired';
import { useSocietyStore } from '@/store/societyStore';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, FileText, Receipt } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { FlatList, Linking, Text, TouchableOpacity, View } from 'react-native';

const HistoryItem = memo(({ item }: { item: any }) => (
  <View className="bg-white p-5 rounded-[32px] mb-4 shadow-sm border border-slate-50">
    <View className="flex-row items-center mb-4">
      <View className={`p-4 rounded-2xl mr-4 ${
        item.type === 'credit' ? 'bg-success/10' : 'bg-danger/10'
      }`}>
        {item.type === 'credit' ? (
          <ArrowDownLeft size={24} color="#22c55e" />
        ) : (
          <ArrowUpRight size={24} color="#ef4444" />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-black text-slate-800 text-lg uppercase tracking-tight">
          {item.type === 'credit' ? 'Society Income' : 'Society Expense'}
        </Text>
        <Text className="text-slate-400 text-xs font-bold mt-0.5">
          {format(new Date(item.created_at), 'EEEE, MMM dd • hh:mm a')}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`font-black text-xl ${
          item.type === 'credit' ? 'text-success' : 'text-danger'
        }`}>
          {item.type === 'credit' ? '+' : '-'} {item.amount.toLocaleString()}
        </Text>
        <Text className="text-slate-300 text-[10px] font-black uppercase mt-1">PKR</Text>
      </View>
    </View>

    {item.reference?.note && (
      <View className="bg-slate-50/80 p-4 rounded-2xl mb-3 flex-row items-start">
        <FileText size={16} color="#94a3b8" />
        <Text className="text-slate-500 text-sm ml-3 flex-1 italic leading-5">
          "{item.reference.note}"
        </Text>
      </View>
    )}

    <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-slate-50">
      <View className="flex-row items-center">
        <Receipt size={14} color="#cbd5e1" />
        <Text className="text-slate-400 text-[10px] font-black uppercase ml-2 tracking-widest">
          Ref: {item.reference_type}
        </Text>
      </View>
      {item.reference?.proof_url && (
        <TouchableOpacity 
          onPress={() => Linking.openURL(item.reference.proof_url)}
          className="flex-row items-center"
        >
          <Text className="text-primary font-black text-[10px] uppercase mr-2">View Proof</Text>
          <ExternalLink size={12} color="#10b981" />
        </TouchableOpacity>
      )}
    </View>

    <TransactionComments
      referenceType={item.reference_type}
      referenceId={item.reference_id}
    />
  </View>
));

export default function HistoryScreen() {
  const { activeSociety } = useSocietyStore();
  const { ledger, isLoadingLedger, refresh } = useLedger();

  const renderItem = useCallback(({ item }: { item: any }) => (
    <HistoryItem item={item} />
  ), []);

  if (!activeSociety) {
    return <SocietyRequired title="History" />;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-12 pb-6">
        <Text className="text-slate-400 text-xs font-black uppercase tracking-[2px] mb-1">Transaction</Text>
        <Text className="text-4xl font-black text-slate-900">History</Text>
      </View>
      
      <FlatList
        data={ledger}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        refreshing={isLoadingLedger}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        renderItem={renderItem}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-slate-300 font-bold">No transactions found</Text>
          </View>
        }
      />
    </View>
  );
}
