import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { VoiceProfile, CreateVoiceProfileInput, UpdateVoiceProfileInput } from '@shared/types/speech';

export function useVoiceProfiles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/voice-profiles'],
  });

  const createMutation = useMutation({
    mutationFn: (newProfile: CreateVoiceProfileInput) => 
      apiRequest('POST', '/api/voice-profiles', newProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-profiles'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<UpdateVoiceProfileInput> }) => 
      apiRequest('PATCH', `/api/voice-profiles/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-profiles'] });
      // Also invalidate speech settings since they might depend on a profile
      queryClient.invalidateQueries({ queryKey: ['/api/speech-settings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/voice-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice-profiles'] });
      // Also invalidate speech settings since they might depend on a profile
      queryClient.invalidateQueries({ queryKey: ['/api/speech-settings'] });
    },
  });

  return {
    profiles: data || [],
    isLoading,
    error,
    createProfile: createMutation.mutate,
    updateProfile: updateMutation.mutate,
    deleteProfile: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
