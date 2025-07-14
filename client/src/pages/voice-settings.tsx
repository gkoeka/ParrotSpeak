import { useState } from 'react';
import { useVoiceProfiles } from '@/hooks/use-voice-profiles';
import { useSpeechSettings } from '@/hooks/use-speech-settings';
import { VoiceProfile } from '@shared/types/speech';
import { languages } from '@/lib/languages';

export default function VoiceSettingsPage() {
  const { profiles: rawProfiles, isLoading: isLoadingProfiles, createProfile, updateProfile, deleteProfile } = useVoiceProfiles();
  const { settings: rawSettings, isLoading: isLoadingSettings, updateSettings } = useSpeechSettings();
  
  // Ensure we have default values if data is not loaded yet
  const profiles = rawProfiles || [];
  const settingsWithDefaults = rawSettings || {
    autoPlay: true,
    useProfileForLanguage: true,
    defaultProfileId: undefined
  };
  
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    languageCode: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    isDefault: false
  });

  // Function to handle form input changes for new profile
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!e || !e.target) return;
    const { name, value, type } = e.target;
    
    // Handle number inputs
    if (type === 'number') {
      const numValue = parseFloat(value);
      setNewProfile(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 1.0 : numValue
      }));
      return;
    }
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewProfile(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // Handle text and select inputs
    setNewProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle creating a new profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile(newProfile, {
      onSuccess: () => {
        setIsCreating(false);
        setNewProfile({
          name: '',
          languageCode: 'en-US',
          pitch: 1.0,
          rate: 1.0,
          isDefault: false
        });
      }
    });
  };

  // Function to handle updating a profile
  const handleUpdateProfile = (id: string, updates: Partial<VoiceProfile>) => {
    updateProfile({ id, updates }, {
      onSuccess: () => {
        setIsEditing(null);
      }
    });
  };

  // Function to handle deleting a profile
  const handleDeleteProfile = (id: string) => {
    if (confirm('Are you sure you want to delete this voice profile?')) {
      deleteProfile(id);
    }
  };

  // Function to handle updating speech settings
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    
    if (type === 'checkbox') {
      updateSettings({ [name]: checked });
    } else {
      updateSettings({ [name]: value });
    }
  };

  if (isLoadingProfiles || isLoadingSettings) {
    return <div className="container mx-auto p-6">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Voice Settings</h1>
      
      {/* Global speech settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Speech Playback Settings</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="autoPlay" 
              name="autoPlay" 
              className="mr-2 h-5 w-5" 
              checked={settingsWithDefaults.autoPlay} 
              onChange={handleSettingsChange} 
            />
            <label htmlFor="autoPlay" className="text-sm font-medium">Automatically play translations</label>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="useProfileForLanguage" 
              name="useProfileForLanguage" 
              className="mr-2 h-5 w-5" 
              checked={settingsWithDefaults.useProfileForLanguage} 
              onChange={handleSettingsChange} 
            />
            <label htmlFor="useProfileForLanguage" className="text-sm font-medium">Use language-specific voice profiles when available</label>
          </div>
          
          <div className="mt-2">
            <label htmlFor="defaultProfileId" className="block text-sm font-medium mb-1">Default voice profile:</label>
            <select 
              id="defaultProfileId" 
              name="defaultProfileId" 
              className="w-full md:w-1/2 p-2 border rounded-md" 
              value={settingsWithDefaults.defaultProfileId || ''} 
              onChange={(e) => updateSettings({ defaultProfileId: e.target.value || undefined })}
            >
              <option value="">Select a default profile</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.languageCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Voice profiles management */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Voice Profiles</h2>
          <button 
            onClick={() => setIsCreating(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isCreating}
          >
            Create New Profile
          </button>
        </div>
        
        {isCreating && (
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6">
            <h3 className="text-lg font-medium mb-3">Create New Voice Profile</h3>
            <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Profile Name:</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className="w-full p-2 border rounded-md" 
                  value={newProfile.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="languageCode" className="block text-sm font-medium mb-1">Language:</label>
                <select 
                  id="languageCode" 
                  name="languageCode" 
                  className="w-full p-2 border rounded-md" 
                  value={newProfile.languageCode} 
                  onChange={handleInputChange} 
                  required
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pitch" className="block text-sm font-medium mb-1">
                    Pitch: {typeof newProfile.pitch === 'number' ? newProfile.pitch.toFixed(1) : '1.0'}
                  </label>
                  <input 
                    type="range" 
                    id="pitch" 
                    name="pitch" 
                    className="w-full" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={newProfile.pitch} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div>
                  <label htmlFor="rate" className="block text-sm font-medium mb-1">
                    Rate: {typeof newProfile.rate === 'number' ? newProfile.rate.toFixed(1) : '1.0'}
                  </label>
                  <input 
                    type="range" 
                    id="rate" 
                    name="rate" 
                    className="w-full" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1" 
                    value={newProfile.rate} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isDefault" 
                  name="isDefault" 
                  className="mr-2 h-5 w-5" 
                  checked={newProfile.isDefault} 
                  onChange={handleInputChange} 
                />
                <label htmlFor="isDefault" className="text-sm font-medium">Set as default profile</label>
              </div>
              
              <div className="flex gap-2 mt-2">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Profile
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* List of existing profiles */}
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No voice profiles found.</p>
          ) : (
            profiles.map(profile => (
              <div key={profile.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium">
                      {profile.name}
                      {profile.isDefault && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {languages.find(lang => lang.code === profile.languageCode)?.name || profile.languageCode}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!profile.isDefault && (
                      <button 
                        onClick={() => handleUpdateProfile(profile.id, { isDefault: true })}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        Set as Default
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setIsEditing(profile.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    
                    {!profile.isDefault && (
                      <button 
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-sm font-medium">Pitch:</span> {parseFloat(profile.pitch as any).toFixed(1)}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Rate:</span> {parseFloat(profile.rate as any).toFixed(1)}
                  </div>
                </div>
                
                {isEditing === profile.id && (
                  <div className="mt-4 pt-4 border-t">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const updates = {
                        name: formData.get('name') as string,
                        languageCode: formData.get('languageCode') as string,
                        pitch: parseFloat(formData.get('pitch') as string),
                        rate: parseFloat(formData.get('rate') as string),
                      };
                      handleUpdateProfile(profile.id, updates);
                    }} className="flex flex-col gap-4">
                      <div>
                        <label htmlFor={`name-${profile.id}`} className="block text-sm font-medium mb-1">Profile Name:</label>
                        <input 
                          type="text" 
                          id={`name-${profile.id}`} 
                          name="name" 
                          className="w-full p-2 border rounded-md" 
                          defaultValue={profile.name} 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`languageCode-${profile.id}`} className="block text-sm font-medium mb-1">Language:</label>
                        <select 
                          id={`languageCode-${profile.id}`} 
                          name="languageCode" 
                          className="w-full p-2 border rounded-md" 
                          defaultValue={profile.languageCode} 
                          required
                        >
                          {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name} ({lang.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`pitch-${profile.id}`} className="block text-sm font-medium mb-1">
                            Pitch: <span id={`pitch-value-${profile.id}`}>{parseFloat(profile.pitch as any).toFixed(1)}</span>
                          </label>
                          <input 
                            type="range" 
                            id={`pitch-${profile.id}`} 
                            name="pitch" 
                            className="w-full" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1" 
                            defaultValue={profile.pitch} 
                            onChange={(e) => {
                              const value = e.target.value;
                              document.getElementById(`pitch-value-${profile.id}`)!.textContent = parseFloat(value).toFixed(1);
                            }}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor={`rate-${profile.id}`} className="block text-sm font-medium mb-1">
                            Rate: <span id={`rate-value-${profile.id}`}>{parseFloat(profile.rate as any).toFixed(1)}</span>
                          </label>
                          <input 
                            type="range" 
                            id={`rate-${profile.id}`} 
                            name="rate" 
                            className="w-full" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1" 
                            defaultValue={profile.rate} 
                            onChange={(e) => {
                              const value = e.target.value;
                              document.getElementById(`rate-value-${profile.id}`)!.textContent = parseFloat(value).toFixed(1);
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <button 
                          type="submit" 
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsEditing(null)} 
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
