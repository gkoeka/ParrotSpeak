import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { SpeechSettings } from '@shared/types/speech';

export function useSpeechSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/speech-settings'],
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<SpeechSettings>) => 
      apiRequest('PATCH', '/api/speech-settings', updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speech-settings'] });
    },
  });

  // Only provide defaults for undefined values, not when data is null or false
  const settings = data ? data : (isLoading ? {
    autoPlay: true,
    useProfileForLanguage: true,
    defaultProfileId: undefined,
  } : data);

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
