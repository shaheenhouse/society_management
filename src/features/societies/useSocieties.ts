import { supabase } from '@/api/supabase';
import { useAuthStore } from '@/store/authStore';
import { useSocietyStore } from '@/store/societyStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useSocieties = () => {
  const { user } = useAuthStore();
  const { setSocieties, activeSociety } = useSocietyStore();
  const queryClient = useQueryClient();

  const fetchSocieties = useQuery({
    queryKey: ['societies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('society_members')
        .select(`
          society_id,
          role_id,
          status,
          societies (
            id,
            name,
            description
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      const formattedSocieties = (data || []).map((item: any) => ({
        ...item.societies,
        role_id: item.role_id,
        status: item.status,
      }));

      setSocieties(formattedSocieties);
      return formattedSocieties;
    },
    enabled: !!user?.id,
  });

  const ensureProfileExists = async () => {
    if (!user) return;
    
    // Check if profile exists
    const { data: profile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) throw checkError;

    // If no profile, create one manually as fallback
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url,
        });
      
      if (insertError) throw insertError;
    }
  };

  const createSociety = useMutation({
    mutationFn: async ({ name, description, isPrivate = false }: { name: string, description: string, isPrivate?: boolean }) => {
      await ensureProfileExists();

      // 1. Create society
      const { data: society, error: societyError } = await supabase
        .from('societies')
        .insert({ name, description, is_private: isPrivate, created_by: user?.id })
        .select()
        .single();

      if (societyError) throw societyError;

      // 2. Add creator as super_admin
      const { error: memberError } = await supabase
        .from('society_members')
        .insert({
          user_id: user?.id,
          society_id: society.id,
          role_id: 1, // super_admin
          status: 'active',
        });

      if (memberError) throw memberError;

      return society;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  const searchPublicSocieties = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .eq('is_private', false)
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const joinSocietyById = useMutation({
    mutationFn: async (societyId: string) => {
      await ensureProfileExists();

      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('society_members')
        .select('id')
        .eq('user_id', user?.id)
        .eq('society_id', societyId)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) throw new Error('Already a member or pending');

      const { error } = await supabase
        .from('society_members')
        .insert({
          user_id: user?.id,
          society_id: societyId,
          role_id: 5, // member
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  const joinSocietyByCode = useMutation({
    mutationFn: async (inviteCode: string) => {
      await ensureProfileExists();

      // 1. Find society by code (first 8 chars of ID)
      const { data: societies, error: findError } = await supabase
        .from('societies')
        .select('id, name');

      if (findError) throw findError;

      const targetSociety = societies.find(s => s.id.substring(0, 8).toUpperCase() === inviteCode.toUpperCase());
      
      if (!targetSociety) throw new Error('Invalid invite code');

      // 2. Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('society_members')
        .select('id')
        .eq('user_id', user?.id)
        .eq('society_id', targetSociety.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) throw new Error('You are already a member or have a pending request for this society');

      // 3. Add as pending member
      const { error: joinError } = await supabase
        .from('society_members')
        .insert({
          user_id: user?.id,
          society_id: targetSociety.id,
          role_id: 5, // member
          status: 'pending',
        });

      if (joinError) throw joinError;
      return targetSociety;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  const fetchPendingMembers = useQuery({
    queryKey: ['pending-members', user?.id],
    queryFn: async () => {
      // Find societies where current user is admin/super_admin
      const { data: adminSocieties, error: adminError } = await supabase
        .from('society_members')
        .select('society_id')
        .eq('user_id', user?.id)
        .in('role_id', [1, 2]); // super_admin or admin

      if (adminError) throw adminError;
      if (!adminSocieties || adminSocieties.length === 0) return [];

      const societyIds = adminSocieties.map(s => s.society_id);

      // Get pending members for those societies
      const { data: pending, error: pendingError } = await supabase
        .from('society_members')
        .select(`
          id,
          status,
          user_id,
          society_id,
          profiles (name),
          societies (name)
        `)
        .in('society_id', societyIds)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;
      return pending;
    },
    enabled: !!user?.id,
  });

  const fetchSocietyMembers = useQuery({
    queryKey: ['society-members', activeSociety?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('society_members')
        .select(`
          id,
          role_id,
          status,
          user_id,
          profiles (name, avatar_url)
        `)
        .eq('society_id', activeSociety?.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeSociety?.id,
  });

  const manageMember = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string, status: 'active' | 'removed' }) => {
      const { error } = await supabase
        .from('society_members')
        .update({ status })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-members'] });
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string, roleId: number }) => {
      const { error } = await supabase
        .from('society_members')
        .update({ role_id: roleId })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['society-members', activeSociety?.id] });
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    },
  });

  return {
    ...fetchSocieties,
    createSociety,
    joinSocietyByCode,
    fetchPendingMembers,
    manageMember,
    searchPublicSocieties,
    joinSocietyById,
    fetchSocietyMembers,
    updateMemberRole,
  };
};
