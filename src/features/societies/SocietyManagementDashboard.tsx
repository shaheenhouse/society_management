import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useExpenses } from '@/features/expenses/useExpenses';
import { usePayments } from '@/features/payments/usePayments';
import { useSocieties } from '@/features/societies/useSocieties';
import { useSocietyStore } from '@/store/societyStore';
import { CheckCircle2, Clock, Receipt, UserCheck, UserCog, UserX, WalletCards, XCircle } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

const roleToLabel = (roleId?: number) => {
  if (roleId === 1 || roleId === 2) return 'Admin';
  if (roleId === 3) return 'Finance Manager';
  return 'Member';
};

export const SocietyManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'payments' | 'expenses'>('members');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const { activeSociety } = useSocietyStore();
  const { data: societies, fetchPendingMembers, fetchSocietyMembers, manageMember, updateMemberRole } = useSocieties();
  const { fetchPendingPayments, approvePayment } = usePayments();
  const { fetchPendingExpenses, approveExpense, requestExpense } = useExpenses();

  const activeMembership = useMemo(
    () => societies?.find((society: any) => society.id === activeSociety?.id),
    [societies, activeSociety?.id]
  );
  const canManageMembers = activeMembership?.role_id === 1 || activeMembership?.role_id === 2;
  const approverRole: 'admin' | 'finance_manager' = activeMembership?.role_id === 3 ? 'finance_manager' : 'admin';

  const pendingMembers = (fetchPendingMembers.data || []).filter(
    (member: any) => member.society_id === activeSociety?.id
  );
  const activeMembers = fetchSocietyMembers.data || [];
  const pendingPayments = (fetchPendingPayments.data || []).filter(
    (payment: any) => payment.society_id === activeSociety?.id
  );
  const pendingExpenses = (fetchPendingExpenses.data || []).filter(
    (expense: any) => expense.society_id === activeSociety?.id
  );

  const handleMemberAction = async (memberId: string, status: 'active' | 'removed', name: string) => {
    const actionText = status === 'active' ? 'approve' : 'reject';
    Alert.alert('Confirm', `Are you sure you want to ${actionText} ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionText.toUpperCase(),
        style: status === 'active' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await manageMember.mutateAsync({ memberId, status });
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Action failed');
          }
        },
      },
    ]);
  };

  const handleRoleChange = async (memberId: string, roleId: number) => {
    try {
      await updateMemberRole.mutateAsync({ memberId, roleId });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to update role');
    }
  };

  const handlePaymentAction = async (paymentId: string, status: 'verified' | 'rejected') => {
    try {
      await approvePayment.mutateAsync({ paymentId, status, role: approverRole });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to process payment');
    }
  };

  const handleExpenseAction = async (expenseId: string, status: 'approved' | 'rejected') => {
    try {
      const result = await approveExpense.mutateAsync({ expenseId, status, role: approverRole });
      if (status === 'approved' && !result?.finalized) {
        Alert.alert('Approval Recorded', 'One more eligible approval is required to finalize this expense.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to process expense');
    }
  };

  const handleCreateExpense = async () => {
    if (!expenseTitle.trim() || !expenseAmount || Number.isNaN(Number(expenseAmount))) {
      Alert.alert('Error', 'Please add a valid title and amount');
      return;
    }

    try {
      await requestExpense.mutateAsync({
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        description: expenseDescription.trim() || undefined,
      });
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseDescription('');
      Alert.alert('Success', 'Expense request created and sent for approvals');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to create expense request');
    }
  };

  return (
    <View className="flex-1">
      <View className="flex-row bg-slate-100 p-1.5 rounded-[20px] mb-6">
        <TouchableOpacity
          onPress={() => setActiveTab('members')}
          className={`flex-1 py-3 rounded-[16px] items-center ${activeTab === 'members' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`font-black text-xs uppercase ${activeTab === 'members' ? 'text-slate-800' : 'text-slate-400'}`}>
            Members
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('payments')}
          className={`flex-1 py-3 rounded-[16px] items-center ${activeTab === 'payments' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`font-black text-xs uppercase ${activeTab === 'payments' ? 'text-slate-800' : 'text-slate-400'}`}>
            Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('expenses')}
          className={`flex-1 py-3 rounded-[16px] items-center ${activeTab === 'expenses' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`font-black text-xs uppercase ${activeTab === 'expenses' ? 'text-slate-800' : 'text-slate-400'}`}>
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'members' && (
        <View>
          {fetchPendingMembers.isLoading || fetchSocietyMembers.isLoading ? (
            <ActivityIndicator color="#10b981" />
          ) : (
            <>
              <Text className="font-black text-slate-700 mb-2 uppercase text-[10px] tracking-widest">Pending Requests</Text>
              {pendingMembers.length === 0 ? (
                <Card className="items-center py-8 opacity-70">
                  <Clock size={28} color="#94a3b8" />
                  <Text className="text-slate-400 mt-2 font-bold">No pending member requests</Text>
                </Card>
              ) : (
                pendingMembers.map((member: any) => (
                  <Card key={member.id} className="mb-3 border-l-4 border-l-primary">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-bold text-slate-800">{member.profiles?.name || 'User'}</Text>
                        <Text className="text-slate-400 text-xs">Request to join this society</Text>
                      </View>
                      <View className="flex-row gap-2">
                        <TouchableOpacity onPress={() => handleMemberAction(member.id, 'removed', member.profiles?.name)} className="bg-danger/10 p-3 rounded-xl">
                          <UserX size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleMemberAction(member.id, 'active', member.profiles?.name)} className="bg-success/10 p-3 rounded-xl">
                          <UserCheck size={18} color="#22c55e" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))
              )}

              <Text className="font-black text-slate-700 mt-6 mb-2 uppercase text-[10px] tracking-widest">Active Members</Text>
              {activeMembers.map((member: any) => (
                <Card key={member.id} className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-bold text-slate-800">{member.profiles?.name || 'Member'}</Text>
                      <Text className="text-slate-400 text-xs">{roleToLabel(member.role_id)}</Text>
                    </View>

                    {canManageMembers && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleRoleChange(member.id, 5)}
                          className="px-3 py-2 rounded-lg bg-slate-100"
                        >
                          <Text className="text-[10px] font-black text-slate-600 uppercase">Member</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRoleChange(member.id, 3)}
                          className="px-3 py-2 rounded-lg bg-secondary/10"
                        >
                          <Text className="text-[10px] font-black text-secondary uppercase">Finance</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRoleChange(member.id, 2)}
                          className="px-3 py-2 rounded-lg bg-primary/10"
                        >
                          <Text className="text-[10px] font-black text-primary uppercase">Admin</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </>
          )}
        </View>
      )}

      {activeTab === 'payments' && (
        <View>
          {fetchPendingPayments.isLoading ? (
            <ActivityIndicator color="#3b82f6" />
          ) : pendingPayments.length === 0 ? (
            <Card className="items-center py-8 opacity-70">
              <Receipt size={28} color="#94a3b8" />
              <Text className="text-slate-400 mt-2 font-bold">No pending payments</Text>
            </Card>
          ) : (
            pendingPayments.map((payment: any) => (
              <Card key={payment.id} className="mb-3 border-l-4 border-l-secondary">
                <Text className="font-black text-slate-800 text-lg">PKR {Number(payment.amount || 0).toLocaleString()}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">From: {payment.profiles?.name || 'Member'}</Text>
                {payment.note ? <Text className="text-slate-400 mt-2 text-xs italic">"{payment.note}"</Text> : null}
                <View className="flex-row gap-2 mt-4">
                  <Button title="Reject" variant="danger" className="flex-1 h-12" onPress={() => handlePaymentAction(payment.id, 'rejected')} />
                  <Button title="Approve" className="flex-1 h-12" onPress={() => handlePaymentAction(payment.id, 'verified')} />
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {activeTab === 'expenses' && (
        <View>
          <Card className="mb-4">
            <View className="flex-row items-center mb-4">
              <WalletCards size={18} color="#f59e0b" />
              <Text className="ml-2 font-black text-slate-800">New Expense Request</Text>
            </View>
            <Input label="Title" value={expenseTitle} onChangeText={setExpenseTitle} placeholder="Road repair, water supply, etc." />
            <Input label="Amount (PKR)" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="numeric" placeholder="0.00" />
            <Input label="Description (optional)" value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Short reason for expense" />
            <Button title="Submit Expense Request" onPress={handleCreateExpense} loading={requestExpense.isPending} className="mt-2" />
            <Text className="text-[10px] text-slate-400 mt-3">
              Approval rule: requires either 2 finance managers, or 1 admin + 1 finance manager.
            </Text>
          </Card>

          {fetchPendingExpenses.isLoading ? (
            <ActivityIndicator color="#f59e0b" />
          ) : pendingExpenses.length === 0 ? (
            <Card className="items-center py-8 opacity-70">
              <Clock size={28} color="#94a3b8" />
              <Text className="text-slate-400 mt-2 font-bold">No pending expense approvals</Text>
            </Card>
          ) : (
            pendingExpenses.map((expense: any) => (
              <Card key={expense.id} className="mb-3 border-l-4 border-l-amber-500">
                <Text className="font-black text-slate-800 text-lg">{expense.title}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">PKR {Number(expense.amount || 0).toLocaleString()}</Text>
                {expense.description ? <Text className="text-slate-400 mt-2 text-xs">{expense.description}</Text> : null}
                <View className="flex-row gap-2 mt-4">
                  <TouchableOpacity
                    onPress={() => handleExpenseAction(expense.id, 'rejected')}
                    className="flex-1 bg-danger/10 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <XCircle size={16} color="#ef4444" />
                    <Text className="ml-2 text-danger font-black text-xs uppercase">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleExpenseAction(expense.id, 'approved')}
                    className="flex-1 bg-success/10 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <CheckCircle2 size={16} color="#22c55e" />
                    <Text className="ml-2 text-success font-black text-xs uppercase">Approve</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {updateMemberRole.isPending || approvePayment.isPending || approveExpense.isPending ? (
        <View className="flex-row items-center mt-2">
          <UserCog size={14} color="#94a3b8" />
          <Text className="text-slate-400 text-xs ml-2">Updating requests...</Text>
        </View>
      ) : null}
    </View>
  );
};
