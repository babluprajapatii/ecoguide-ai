'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/features/auth/hooks/useUser';
import {
  updateProfile,
  uploadAvatar,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/features/profile/services/profile.service';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User as UserIcon,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
});

type ProfileFormSchema = z.infer<typeof profileFormSchema>;

/**
 * SettingsPage handles theme setup, display name changes, and
 * avatar image uploads.
 *
 * Implements:
 * 1. Zod profile schema validation linked to label elements.
 * 2. Layer 1 client-side uploader check (2MB limits, image MIME type filters).
 * 3. Tabbed SaaS page views (Profile details, Theme switch, Billing preferences).
 * 4. Auth session metadata sync updates.
 */
export default function SettingsPage() {
  const user = useUser();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'billing'>('profile');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);
  const [updateErrorMsg, setUpdateErrorMsg] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileFormSchema),
  });

  // Populate default values
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setValue('displayName', user.user_metadata.display_name);
    } else if (user?.email) {
      setValue('displayName', user.email.split('@')[0] || '');
    }
  }, [user, setValue]);

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Eco User';
  const avatarUrl = user.user_metadata?.avatar_url || null;

  const onSubmit = async (data: ProfileFormSchema) => {
    setSaving(true);
    setUpdateSuccessMsg(null);
    setUpdateErrorMsg(null);

    try {
      // 1. Update public profiles table
      await updateProfile(user.id, { displayName: data.displayName });

      // 2. Update auth metadata to synchronize client selector hook
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: data.displayName },
      });

      if (error) throw error;

      setUpdateSuccessMsg('Profile details updated successfully!');
    } catch (err) {
      const error = err as { message?: string };
      setUpdateErrorMsg(error.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    // Layer 1 Client validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('Invalid file type: only JPEG, PNG, and WebP are allowed.');
      setUploading(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File is too large: maximum allowed size is 2MB.');
      setUploading(false);
      return;
    }

    try {
      // Upload avatar to storage bucket
      const publicUrl = await uploadAvatar(user.id, file);

      // Write URL back to public profile table
      await updateProfile(user.id, { avatarUrl: publicUrl });

      // Sync user session metadata
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (error) throw error;

      setUploadSuccess('Profile picture updated successfully!');
    } catch (err) {
      const error = err as { message?: string };
      setUploadError(error.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
        <p className="text-stone-400 text-sm mt-1">
          Manage your personal details, visual themes, and billing profiles.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-eco-500/10 flex gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-lg ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-lg ${
            activeTab === 'theme'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Theme
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-lg ${
            activeTab === 'billing'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Billing
        </button>
      </div>

      {/* Profile Details Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 backdrop-blur-md space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserIcon size={20} className="text-emerald-400" />
              <span>Personal Details</span>
            </h2>

            {/* Success / Error Banners */}
            {updateSuccessMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            {updateErrorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl" role="alert">
                <AlertCircle size={16} className="shrink-0" />
                <span>{updateErrorMsg}</span>
              </div>
            )}

            {/* Avatar uploader */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-eco-500/10">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/40 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-dark-900/60 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer font-semibold text-xs transition-colors">
                  <Upload size={14} />
                  <span>Upload Profile Picture</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                </label>
                <p className="text-[10px] text-stone-500 leading-normal">
                  Supported formats: JPEG, PNG, WebP. Maximum size: 2MB.
                </p>
                {uploadSuccess && (
                  <p className="text-xs text-emerald-400 font-medium">{uploadSuccess}</p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-400 font-medium">{uploadError}</p>
                )}
              </div>
            </div>

            {/* Info form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="displayName" className="text-xs font-semibold text-stone-400">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  aria-invalid={!!errors.displayName}
                  aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                  {...register('displayName')}
                  className="w-full max-w-md px-4 py-2.5 bg-dark-900 border border-eco-500/10 rounded-xl text-stone-200 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {errors.displayName && (
                  <p id="displayName-error" className="text-xs text-red-400">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-stone-500">
                  Email Address (Private)
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full max-w-md px-4 py-2.5 bg-dark-900/50 border border-eco-500/5 rounded-xl text-stone-500 text-sm cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 btn-primary rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {saving && <Loader2 className="animate-spin" size={14} />}
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Theme Settings Tab */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sun size={20} className="text-emerald-400" />
            <span>Visual Themes</span>
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            Select your preferred color scheme interface appearance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold'
                  : 'border-eco-500/10 hover:border-eco-500/30 text-stone-400'
              }`}
            >
              <Sun size={24} />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold'
                  : 'border-eco-500/10 hover:border-eco-500/30 text-stone-400'
              }`}
            >
              <Moon size={24} />
              <span>Dark Mode</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'system'
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400 font-semibold'
                  : 'border-eco-500/10 hover:border-eco-500/30 text-stone-400'
              }`}
            >
              <Laptop size={24} />
              <span>System Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Billing Tab (Mock Scaling Page) */}
      {activeTab === 'billing' && (
        <div className="p-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-emerald-400" />
            <span>Billing Profile</span>
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            Manage your EcoGuide Pro subscriptions, tier features, and payment methods.
          </p>

          <div className="rounded-xl border border-eco-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-dark-900/50">
            <div>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                ACTIVE PLAN
              </span>
              <h3 className="font-bold text-white text-base">EcoGuide Free Tier</h3>
              <p className="text-stone-500 text-xs mt-1">
                Access to standard calculators, badges, and weekly coach tips.
              </p>
            </div>
            <button
              disabled
              className="px-4 py-2 border border-stone-700 bg-stone-800 text-stone-500 font-bold text-xs rounded-xl cursor-not-allowed"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
