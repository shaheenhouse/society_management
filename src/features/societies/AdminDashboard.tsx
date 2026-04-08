import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { useSocieties } from '@/features/societies/useSocieties';
import { usePayments } from '@/features/payments/usePayments';
import { Card } from '@/components/ui/Card';
import { UserCheck, UserX, Receipt, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react-native';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'payments'>('members');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { fetchPendingMembers, manageMember } = useSocieties();
  const { fetchPendingPayments, approvePayment } = usePayments();

  const { data: pendingMembers, isLoading: loadingMembers } = fetchPendingMembers;
  const { data: pendingPayments, isLoading: loadingPayments } = fetchPendingPayments;

  const handleMemberAction = async (memberId: string, status: 'active' | 'removed', name: string) => {
    const actionText = status === 'active' ? 'approve' : 'reject';
    Alert.alert('Confirm', `Are you sure you want to ${actionText} ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: actionText.toUpperCase(), 
        style: status === 'active' ? 'default' : 'destructive',
        onPress: () => manageMember.mutate({ memberId, status }) 
      }
    ]);
  };

  const handlePaymentAction = async (paymentId: string, status: 'verified' | 'rejected', name: string, amount: number) => {
    const actionText = status === 'verified' ? 'approve' : 'reject';
    Alert.alert('Confirm Payment', `${actionText.toUpperCase()} PKR ${amount.toLocaleString()} from ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: actionText.toUpperCase(), 
        style: status === 'verified' ? 'default' : 'destructive',
        onPress: () => approvePayment.mutate({ paymentId, status, role: 'admin' }) 
      }
    ]);
  };

  const renderMemberItem = (item: any) => (
    <Card key={item.id} className="mb-3 border-l-4 border-l-primary">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-bold text-slate-800 text-lg">{item.profiles?.name || 'User'}</Text>
          <Text className="text-slate-500 text-xs uppercase font-black tracking-widest mt-1">
            Wants to join: {item.societies?.name}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity 
            onPress={() => handleMemberAction(item.id, 'removed', item.profiles?.name)}
            className="bg-danger/10 p-3 rounded-2xl"
          >
            <UserX size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleMemberAction(item.id, 'active', item.profiles?.name)}
            className="bg-success/10 p-3 rounded-2xl"
          >
            <UserCheck size={20} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderPaymentItem = (item: any) => (
    <Card key={item.id} className="mb-3 border-l-4 border-l-secondary">
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="font-black text-slate-800 text-xl">PKR {item.amount.toLocaleString()}</Text>
          <Text className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
            From: {item.profiles?.name}
          </Text>
          <Text className="text-slate-400 text-[10px] mt-1">
            Society: {item.societies?.name}
          </Text>
        </View>
        {item.proof_url && (
          <TouchableOpacity 
            onPress={() => setSelectedImage(item.proof_url)}
            className="bg-slate-100 p-3 rounded-2xl flex-row items-center"
          >
            <Eye size={16} color="#64748b" />
            <Text className="text-slate-500 font-bold text-xs ml-2">Proof</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {item.note && (
        <View className="bg-slate-50 p-3 rounded-xl mb-4">
          <Text className="text-slate-500 text-sm italic italic">"{item.note}"</Text>
        </View>
      )}

      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={() => handlePaymentAction(item.id, 'rejected', item.profiles?.name, item.amount)}
          className="flex-1 bg-danger/10 py-3 rounded-xl flex-row justify-center items-center"
        >
          <XCircle size={18} color="#ef4444" />
          <Text className="text-danger font-black ml-2 uppercase text-xs">Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handlePaymentAction(item.id, 'verified', item.profiles?.name, item.amount)}
          className="flex-1 bg-success/10 py-3 rounded-xl flex-row justify-center items-center"
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <Text className="text-success font-black ml-2 uppercase text-xs">Approve</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View className="flex-1">
      {/* Tab Switcher */}
      <View className="flex-row bg-slate-100 p-1.5 rounded-[20px] mb-6">
        <TouchableOpacity 
          onPress={() => setActiveTab('members')}
          className={`flex-1 py-3 rounded-[16px] flex-row justify-center items-center ${activeTab === 'members' ? 'bg-white shadow-sm' : ''}`}
        >
          <UserCheck size={18} color={activeTab === 'members' ? '#10b981' : '#94a3b8'} />
          <Text className={`ml-2 font-black text-xs uppercase ${activeTab === 'members' ? 'text-slate-800' : 'text-slate-400'}`}>Members</Text>
          {pendingMembers?.length > 0 && (
            <View className="bg-danger px-1.5 py-0.5 rounded-full ml-2">
              <Text className="text-white text-[10px] font-black">{pendingMembers.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('payments')}
          className={`flex-1 py-3 rounded-[16px] flex-row justify-center items-center ${activeTab === 'payments' ? 'bg-white shadow-sm' : ''}`}
        >
          <Receipt size={18} color={activeTab === 'payments' ? '#3b82f6' : '#94a3b8'} />
          <Text className={`ml-2 font-black text-xs uppercase ${activeTab === 'payments' ? 'text-slate-800' : 'text-slate-400'}`}>Payments</Text>
          {pendingPayments?.length > 0 && (
            <View className="bg-danger px-1.5 py-0.5 rounded-full ml-2">
              <Text className="text-white text-[10px] font-black">{pendingPayments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View>
        {activeTab === 'members' ? (
          loadingMembers ? <ActivityIndicator color="#10b981" /> :
          pendingMembers?.length === 0 ? (
            <Card className="items-center py-12 opacity-60">
              <Clock size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 font-bold">No member requests</Text>
            </Card>
          ) : pendingMembers.map(renderMemberItem)
        ) : (
          loadingPayments ? <ActivityIndicator color="#3b82f6" /> :
          pendingPayments?.length === 0 ? (
            <Card className="items-center py-12 opacity-60">
              <Receipt size={40} color="#cbd5e1" />
              <Text className="text-slate-400 mt-4 font-bold">No pending payments</Text>
            </Card>
          ) : pendingPayments.map(renderPaymentItem)
        )}
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center p-6">
          <TouchableOpacity 
            onPress={() => setSelectedImage(null)}
            className="absolute top-12 right-6 bg-white/20 p-3 rounded-full"
          >
            <XCircle size={24} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }} 
              className="w-full h-[70%] rounded-3xl"
              resizeMode="contain"
            />
          )}
          <Text className="text-white font-bold mt-6">Payment Proof Screenshot</Text>
        </View>
      </Modal>
    </View>
  );
};