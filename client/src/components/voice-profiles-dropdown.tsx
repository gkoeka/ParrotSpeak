import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useVoiceProfiles } from '@/hooks/use-voice-profiles';
import { useSpeechSettings } from '@/hooks/use-speech-settings';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import { cn } from '@/lib/utils';
import { Language } from '@/types';
import { useLocation } from 'wouter';
import { VoiceProfile } from '@shared/types/speech';

interface VoiceProfilesDropdownProps {
  targetLanguage: Language;
  onProfileSelect?: (profileId: string) => void;
}

export default function VoiceProfilesDropdown({ targetLanguage, onProfileSelect }: VoiceProfilesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [currentProfile, setCurrentProfile] = useState<VoiceProfile | null>(null);
  const { profiles: rawProfiles, isLoading } = useVoiceProfiles();
  const { settings: rawSettings } = useSpeechSettings();
  const { speak, isSpeaking } = useTextToSpeech();
  const [, navigate] = useLocation();
  
  // Ensure we have default values if data is not loaded yet
  const profiles = rawProfiles || [];
  const settings = rawSettings || {
    autoPlay: true,
    useProfileForLanguage: true,
    defaultProfileId: undefined
  };
  
  // Update value when we load profiles and settings
  useEffect(() => {
    // If we have a selected profile already, keep it
    if (value && profiles.some(p => p.id === value)) {
      const profile = profiles.find(p => p.id === value);
      if (profile) setCurrentProfile(profile);
      return;
    }
    
    // Otherwise, try to find an appropriate default
    if (profiles.length > 0) {
      // First try language-specific profile if enabled
      if (settings.useProfileForLanguage) {
        // Try exact match
        const exactMatch = profiles.find(p => p.languageCode === targetLanguage.code);
        if (exactMatch) {
          setValue(exactMatch.id);
          setCurrentProfile(exactMatch);
          return;
        }
        
        // Try language base match
        const targetLangBase = targetLanguage.code.split('-')[0];
        const baseMatch = profiles.find(p => p.languageCode.startsWith(`${targetLangBase}-`));
        if (baseMatch) {
          setValue(baseMatch.id);
          setCurrentProfile(baseMatch);
          return;
        }
      }
      
      // If no language match or language matching disabled, use default
      if (settings.defaultProfileId) {
        const defaultProfile = profiles.find(p => p.id === settings.defaultProfileId);
        if (defaultProfile) {
          setValue(defaultProfile.id);
          setCurrentProfile(defaultProfile);
          return;
        }
      }
      
      // Last resort: use profile marked as default
      const markedDefault = profiles.find(p => p.isDefault);
      if (markedDefault) {
        setValue(markedDefault.id);
        setCurrentProfile(markedDefault);
        return;
      }
      
      // Ultimate fallback: first profile
      setValue(profiles[0].id);
      setCurrentProfile(profiles[0]);
    }
  }, [profiles, settings.defaultProfileId, settings.useProfileForLanguage, targetLanguage.code, value]);

  // Get all profiles - we'll now show all profiles and not filter by language
  // This allows users to select any voice profile for any conversation

  // Handle profile selection
  const handleProfileChange = useCallback((profileId: string) => {
    const selectedProfile = profiles.find(p => p.id === profileId);
    if (selectedProfile) {
      setValue(profileId);
      setCurrentProfile(selectedProfile);
      
      // Call the optional onProfileSelect callback if provided
      if (onProfileSelect) {
        onProfileSelect(profileId);
      }
    }
    setOpen(false);
  }, [profiles, onProfileSelect]);
  
  // Quick test of the selected voice
  const testVoice = useCallback(() => {
    if (currentProfile) {
      const testPhrase = `This is the ${currentProfile.name} voice profile.`;
      speak(testPhrase, currentProfile.languageCode);
    }
  }, [currentProfile, speak]);

  if (isLoading || profiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm"
          >
            {currentProfile?.name || "Select voice profile"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[290px]">
          <Command>
            <CommandInput placeholder="Search voice profiles..." className="h-9" />
            <CommandEmpty>
              <div className="p-2 text-sm text-center">
                No voice profiles found.
                <Button 
                  variant="link" 
                  className="text-xs p-0 h-auto underline block w-full" 
                  onClick={() => {
                    setOpen(false);
                    navigate('/voice-settings');
                  }}
                >
                  Create a new voice profile
                </Button>
              </div>
            </CommandEmpty>
            <CommandList className="max-h-[400px]">
              <CommandGroup heading="All Voice Profiles">
                {(profiles as VoiceProfile[]).map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={profile.id}
                    onSelect={() => handleProfileChange(profile.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{profile.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {profile.languageCode} • Pitch: {typeof profile.pitch === 'number' ? profile.pitch.toFixed(1) : 1.0}, 
                          Rate: {typeof profile.rate === 'number' ? profile.rate.toFixed(1) : 1.0}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === profile.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="p-2 border-t flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 text-xs flex items-center justify-center"
              onClick={testVoice}
              disabled={isSpeaking || !currentProfile}
            >
              <Volume2 className="h-3 w-3 mr-1" />
              Test Voice
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs flex items-center justify-center" 
              onClick={() => {
                setOpen(false);
                navigate('/voice-settings');
              }}
            >
              <Settings className="h-3 w-3 mr-1" />
              Manage Profiles
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
