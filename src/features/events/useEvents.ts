import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useEvents = () => {
  const { user } = useAuthStore();
  const { activeSociety } = useSocietyStore();
  const queryClient = useQueryClient();

  const fetchEvents = useQuery({
    queryKey: ['society-events', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('society_events')
        .select(`
          id,
          title,
          description,
          event_type,
          target_amount,
          created_at,
          event_contributions (amount)
        `)
        .eq('society_id', activeSociety?.id)
        .order('created_at', { ascending: false });

      if (error) {
        if ((error as any).code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!activeSociety?.id,
  });

  const createEvent = useMutation({
    mutationFn: async ({
      title,
      description,
      targetAmount,
      type = 'fundraising',
    }: {
      title: string;
      description?: string;
      targetAmount?: number;
      type?: 'fundraising' | 'meeting' | 'announcement';
    }) => {
      const { error } = await supabase.from('society_events').insert({
        society_id: activeSociety?.id,
        title,
        description,
        event_type: type,
        target_amount: targetAmount,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['society-events', activeSociety?.id] });
    },
  });

  return {
    ...fetchEvents,
    createEvent,
  };
};
