import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const usePayments = () => {
  const { user } = useAuthStore();
  const { activeSociety } = useSocietyStore();
  const queryClient = useQueryClient();

  const fetchPayments = useQuery({
    queryKey: ['payments', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          amount,
          note,
          proof_url,
          status,
          created_at,
          profiles:user_id (name, avatar_url)
        `)
        .eq('society_id', activeSociety?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeSociety?.id,
  });

  const submitPayment = useMutation({
    mutationFn: async ({ amount, note, proofUrl }: { amount: number, note?: string, proofUrl?: string }) => {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          society_id: activeSociety?.id,
          user_id: user?.id,
          amount,
          note,
          proof_url: proofUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', activeSociety?.id] });
    },
  });

  const approvePayment = useMutation({
    mutationFn: async ({ paymentId, status, role }: { paymentId: string, status: 'received' | 'verified' | 'rejected', role: 'admin' | 'finance_manager' }) => {
      // 1. Record the approval
      const { error: approvalError } = await supabase
        .from('payment_approvals')
        .insert({
          payment_request_id: paymentId,
          approved_by: user?.id,
          role,
          status: status === 'rejected' ? 'rejected' : 'approved',
        });

      if (approvalError) throw approvalError;

      // 2. Update the status of the request
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ status })
        .eq('id', paymentId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', activeSociety?.id] });
      queryClient.invalidateQueries({ queryKey: ['ledger', activeSociety?.id] });
    },
  });

  const fetchPendingPayments = useQuery({
    queryKey: ['pending-payments', user?.id],
    queryFn: async () => {
      // Find societies where user is admin
      const { data: adminSocieties } = await supabase
        .from('society_members')
        .select('society_id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .in('role_id', [1, 2, 3]);

      if (!adminSocieties || adminSocieties.length === 0) return [];
      const societyIds = adminSocieties.map(s => s.society_id);

      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          society_id,
          amount,
          note,
          proof_url,
          status,
          created_at,
          profiles:user_id (name),
          societies:society_id (id, name)
        `)
        .in('society_id', societyIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    ...fetchPayments,
    submitPayment,
    approvePayment,
    fetchPendingPayments,
  };
};
