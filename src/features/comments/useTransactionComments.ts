import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useTransactionComments = (referenceType?: string, referenceId?: string) => {
  const { user } = useAuthStore();
  const { activeSociety } = useSocietyStore();
  const queryClient = useQueryClient();

  const fetchComments = useQuery({
    queryKey: ['transaction-comments', activeSociety?.id, referenceType, referenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_comments')
        .select(`
          id,
          comment,
          created_at,
          profiles:user_id (name)
        `)
        .eq('society_id', activeSociety?.id)
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // If schema migration is not yet applied, avoid breaking timeline.
        if ((error as any).code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
    enabled: !!activeSociety?.id && !!referenceType && !!referenceId,
  });

  const addComment = useMutation({
    mutationFn: async (comment: string) => {
      const { error } = await supabase
        .from('transaction_comments')
        .insert({
          society_id: activeSociety?.id,
          reference_type: referenceType,
          reference_id: referenceId,
          user_id: user?.id,
          comment: comment.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transaction-comments', activeSociety?.id, referenceType, referenceId],
      });
    },
  });

  return {
    comments: fetchComments.data || [],
    isLoadingComments: fetchComments.isLoading,
    addComment,
  };
};
