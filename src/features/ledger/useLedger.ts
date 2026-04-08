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
        .select(`
          id,
          type,
          amount,
          reference_type,
          created_at,
          payment_requests:reference_id (note, proof_url)
        `)
        .eq('society_id', activeSociety?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
