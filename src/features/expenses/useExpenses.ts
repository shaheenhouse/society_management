import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useExpenses = () => {
  const { user } = useAuthStore();
  const { activeSociety } = useSocietyStore();
  const queryClient = useQueryClient();

  const fetchExpenses = useQuery({
    queryKey: ['expenses', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_requests')
        .select(`
          id,
          title,
          amount,
          description,
          proof_url,
          status,
          created_at,
          profiles:created_by (name, avatar_url)
        `)
        .eq('society_id', activeSociety?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeSociety?.id,
  });

  const requestExpense = useMutation({
    mutationFn: async ({ title, amount, description, proofUrl }: { title: string, amount: number, description?: string, proofUrl?: string }) => {
      const { data, error } = await supabase
        .from('expense_requests')
        .insert({
          society_id: activeSociety?.id,
          created_by: user?.id,
          title,
          amount,
          description,
          proof_url: proofUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeSociety?.id] });
    },
  });

  const approveExpense = useMutation({
    mutationFn: async ({ expenseId, status, role }: { expenseId: string, status: 'approved' | 'rejected', role: 'admin' | 'finance_manager' }) => {
      // 1. Record approval
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .insert({
          expense_request_id: expenseId,
          approved_by: user?.id,
          role,
          status,
        });

      if (approvalError) throw approvalError;

      // 2. Update status (if needed)
      // Note: Real logic might need multiple approvals before changing status to 'approved'
      // For now, let's say one approval is enough if role is admin/finance_manager
      const { error: updateError } = await supabase
        .from('expense_requests')
        .update({ status })
        .eq('id', expenseId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeSociety?.id] });
      queryClient.invalidateQueries({ queryKey: ['ledger', activeSociety?.id] });
    },
  });

  return {
    ...fetchExpenses,
    requestExpense,
    approveExpense,
  };
};
