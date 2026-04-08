import { supabase } from '@/api/supabase';
import { useSocietyStore } from '@/store/societyStore';
import { useQuery } from '@tanstack/react-query';

export const useLedger = () => {
  const { activeSociety } = useSocietyStore();

  const fetchLedger = useQuery({
    queryKey: ['ledger', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('id, type, amount, reference_id, reference_type, created_at')
        .eq('society_id', activeSociety?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries = data || [];
      const paymentIds = entries
        .filter((entry: any) => entry.reference_type === 'payment' && entry.reference_id)
        .map((entry: any) => entry.reference_id);
      const expenseIds = entries
        .filter((entry: any) => entry.reference_type === 'expense' && entry.reference_id)
        .map((entry: any) => entry.reference_id);

      const paymentMap: Record<string, any> = {};
      if (paymentIds.length > 0) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('id, note, proof_url')
          .in('id', paymentIds);

        if (paymentsError) throw paymentsError;
        (payments || []).forEach((payment: any) => {
          paymentMap[payment.id] = payment;
        });
      }

      const expenseMap: Record<string, any> = {};
      if (expenseIds.length > 0) {
        const { data: expenses, error: expensesError } = await supabase
          .from('expense_requests')
          .select('id, title, description, proof_url')
          .in('id', expenseIds);

        if (expensesError) throw expensesError;
        (expenses || []).forEach((expense: any) => {
          expenseMap[expense.id] = expense;
        });
      }

      return entries.map((entry: any) => ({
        ...entry,
        amount: Number(entry.amount || 0),
        reference:
          entry.reference_type === 'payment'
            ? paymentMap[entry.reference_id] || null
            : entry.reference_type === 'expense'
              ? expenseMap[entry.reference_id] || null
              : null,
      }));
    },
    enabled: !!activeSociety?.id,
  });

  const fetchStats = useQuery({
    queryKey: ['stats', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('type, amount')
        .eq('society_id', activeSociety?.id);

      if (error) throw error;

      const stats = (data || []).reduce((acc: any, curr: any) => {
        if (curr.type === 'credit') acc.totalReceived += Number(curr.amount);
        if (curr.type === 'debit') acc.totalSpent += Number(curr.amount);
        return acc;
      }, { totalReceived: 0, totalSpent: 0 });

      return {
        ...stats,
        balance: stats.totalReceived - stats.totalSpent,
      };
    },
    enabled: !!activeSociety?.id,
  });

  return {
    ledger: fetchLedger.data || [],
    isLoadingLedger: fetchLedger.isLoading,
    stats: fetchStats.data || { totalReceived: 0, totalSpent: 0, balance: 0 },
    isLoadingStats: fetchStats.isLoading,
    refresh: () => {
      fetchLedger.refetch();
      fetchStats.refetch();
    },
  };
};
