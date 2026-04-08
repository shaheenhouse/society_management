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
      const { data: membership, error: membershipError } = await supabase
        .from('society_members')
        .select('role_id, status')
        .eq('society_id', activeSociety?.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership || membership.status !== 'active' || ![1, 2, 3].includes(membership.role_id)) {
        throw new Error('Only admins and finance managers can create expense requests');
      }

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
      if (!user?.id) throw new Error('Please sign in again');

      const { data: existingApproval, error: existingError } = await supabase
        .from('expense_approvals')
        .select('id')
        .eq('expense_request_id', expenseId)
        .eq('approved_by', user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingApproval?.id) {
        const { error: updateApprovalError } = await supabase
          .from('expense_approvals')
          .update({ role, status })
          .eq('id', existingApproval.id);

        if (updateApprovalError) throw updateApprovalError;
      } else {
        const { error: approvalError } = await supabase
          .from('expense_approvals')
          .insert({
            expense_request_id: expenseId,
            approved_by: user.id,
            role,
            status,
          });

        if (approvalError) throw approvalError;
      }

      if (status === 'rejected') {
        const { error: rejectError } = await supabase
          .from('expense_requests')
          .update({ status: 'rejected' })
          .eq('id', expenseId);

        if (rejectError) throw rejectError;
        return { finalized: true };
      }

      const { data: approvals, error: approvalsError } = await supabase
        .from('expense_approvals')
        .select('approved_by, role, status')
        .eq('expense_request_id', expenseId)
        .eq('status', 'approved');

      if (approvalsError) throw approvalsError;

      const adminCount = (approvals || []).filter((approval: any) => approval.role === 'admin').length;
      const financeCount = (approvals || []).filter((approval: any) => approval.role === 'finance_manager').length;
      const canFinalize = financeCount >= 2 || (adminCount >= 1 && financeCount >= 1);

      if (canFinalize) {
        const { error: finalizeError } = await supabase
          .from('expense_requests')
          .update({ status: 'approved' })
          .eq('id', expenseId);

        if (finalizeError) throw finalizeError;
      }

      return { finalized: canFinalize };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', activeSociety?.id] });
      queryClient.invalidateQueries({ queryKey: ['ledger', activeSociety?.id] });
    },
  });

  const fetchPendingExpenses = useQuery({
    queryKey: ['pending-expenses', user?.id],
    queryFn: async () => {
      const { data: managerSocieties, error: managerError } = await supabase
        .from('society_members')
        .select('society_id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .in('role_id', [1, 2, 3]);

      if (managerError) throw managerError;
      if (!managerSocieties || managerSocieties.length === 0) return [];

      const societyIds = managerSocieties.map((society: any) => society.society_id);

      const { data, error } = await supabase
        .from('expense_requests')
        .select(`
          id,
          society_id,
          title,
          amount,
          description,
          proof_url,
          status,
          created_at,
          profiles:created_by (name),
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
    ...fetchExpenses,
    requestExpense,
    approveExpense,
    fetchPendingExpenses,
  };
};
