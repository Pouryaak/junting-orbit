/**
 * Settings Tab Component
 * Handles user authentication, profile management, and settings
 */

import React, { useState, useEffect } from 'react';
import { Save, LogIn, User, FileText, MessageSquare, Briefcase, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { getProfile, updateProfile, checkAuth, getLoginUrl, type UserProfile } from '@/services/apiService';
import { handleError, showErrorToUser } from '@/utils/errorHandler';
import { cn } from '@/lib/utils';

export const SettingsTab: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: null,
    resume_text: null,
    preferred_tone: 'neutral',
    target_role: null,
    location: null,
  });

  // Check authentication and load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const authStatus = await checkAuth();
        setIsAuthenticated(authStatus);

        if (authStatus) {
          const userProfile = await getProfile();
          setProfile(userProfile);
        }
      } catch (error) {
        const appError = handleError(error, 'LoadProfile');
        if (appError.message.includes('Unauthorized')) {
          setIsAuthenticated(false);
        } else {
          console.error('Failed to load profile:', appError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert UserProfile to ProfileUpdate (null -> undefined)
      const profileUpdate = {
        full_name: profile.full_name ?? undefined,
        resume_text: profile.resume_text ?? undefined,
        preferred_tone: profile.preferred_tone ?? undefined,
        target_role: profile.target_role ?? undefined,
        location: profile.location ?? undefined,
      };
      
      const updatedProfile = await updateProfile(profileUpdate);
      setProfile(updatedProfile);
      // Show success message (could be a toast in the future)
      alert('Profile saved successfully!');
    } catch (error) {
      const appError = handleError(error, 'SaveProfile');
      showErrorToUser(appError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = () => {
    chrome.tabs.create({ url: getLoginUrl() });
  };

  const handleInputChange = (field: keyof UserProfile, value: string | 'neutral' | 'warm' | 'formal' | null) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Please sign in to access your profile and settings. You can sign in with your email or Google account.
          </p>
        </div>
        <Button
          onClick={handleLogin}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          After signing in, refresh this page to see your profile
        </p>
      </div>
    );
  }

  // Authenticated - show profile form
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Profile Settings</h3>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Full Name
        </label>
        <input
          type="text"
          value={profile.full_name || ''}
          onChange={(e) => handleInputChange('full_name', e.target.value || null)}
          placeholder="Enter your full name"
          className="w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Resume Text */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resume Text
        </label>
        <textarea
          value={profile.resume_text || ''}
          onChange={(e) => handleInputChange('resume_text', e.target.value || null)}
          placeholder="Paste your resume text here (at least 30 characters recommended)"
          rows={8}
          className="w-full px-4 py-2 rounded-lg border bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
        <p className="text-xs text-muted-foreground">
          Your resume is used to generate personalized job analysis and cover letters.
        </p>
      </div>

      {/* Preferred Tone */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Preferred Tone
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['neutral', 'warm', 'formal'] as const).map((tone) => (
            <button
              key={tone}
              onClick={() => handleInputChange('preferred_tone', tone)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                profile.preferred_tone === tone
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:bg-muted'
              )}
            >
              {tone.charAt(0).toUpperCase() + tone.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Choose the tone for your cover letters and communications.
        </p>
      </div>

      {/* Target Role */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Target Role
        </label>
        <input
          type="text"
          value={profile.target_role || ''}
          onChange={(e) => handleInputChange('target_role', e.target.value || null)}
          placeholder="e.g., Senior Frontend Engineer"
          className="w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </label>
        <input
          type="text"
          value={profile.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value || null)}
          placeholder="e.g., Copenhagen / Remote"
          className="w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Info Box */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Make sure to save your resume text before analyzing jobs. 
          The AI uses your resume to generate personalized insights and cover letters.
        </p>
      </div>
    </div>
  );
};
