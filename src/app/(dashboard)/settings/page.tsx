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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-stone-400">
          Manage your personal details, visual themes, and billing profiles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-eco-500/10">
        <button
          onClick={() => setActiveTab('profile')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeTab === 'theme'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Theme
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 ${
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
          <div className="space-y-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 p-6 backdrop-blur-md">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <UserIcon size={20} className="text-emerald-400" />
              <span>Personal Details</span>
            </h2>

            {/* Success / Error Banners */}
            {updateSuccessMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            {updateErrorMsg && (
              <div
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400"
                role="alert"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{updateErrorMsg}</span>
              </div>
            )}

            {/* Avatar uploader */}
            <div className="flex flex-col items-center gap-6 border-b border-eco-500/10 pb-6 sm:flex-row">
              <div className="relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full border-2 border-emerald-500/40 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-3xl font-bold text-emerald-400">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-dark-900/60">
                    <Loader2 className="animate-spin text-emerald-400" size={24} />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10">
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
                <p className="text-[10px] leading-normal text-stone-500">
                  Supported formats: JPEG, PNG, WebP. Maximum size: 2MB.
                </p>
                {uploadSuccess && (
                  <p className="text-xs font-medium text-emerald-400">{uploadSuccess}</p>
                )}
                {uploadError && <p className="text-xs font-medium text-red-400">{uploadError}</p>}
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
                  className="w-full max-w-md rounded-xl border border-eco-500/10 bg-dark-900 px-4 py-2.5 text-sm text-stone-200 transition-colors focus:border-emerald-500 focus:outline-none"
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
                  className="w-full max-w-md cursor-not-allowed rounded-xl border border-eco-500/5 bg-dark-900/50 px-4 py-2.5 text-sm text-stone-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
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
        <div className="space-y-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Sun size={20} className="text-emerald-400" />
            <span>Visual Themes</span>
          </h2>
          <p className="text-sm leading-relaxed text-stone-400">
            Select your preferred color scheme interface appearance.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 rounded-xl border p-4 outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-400'
                  : 'border-eco-500/10 text-stone-400 hover:border-eco-500/30'
              }`}
            >
              <Sun size={24} />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 rounded-xl border p-4 outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-400'
                  : 'border-eco-500/10 text-stone-400 hover:border-eco-500/30'
              }`}
            >
              <Moon size={24} />
              <span>Dark Mode</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-3 rounded-xl border p-4 outline-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                theme === 'system'
                  ? 'border-emerald-500 bg-emerald-500/5 font-semibold text-emerald-400'
                  : 'border-eco-500/10 text-stone-400 hover:border-eco-500/30'
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
        <div className="space-y-6 rounded-2xl border border-eco-500/10 bg-dark-800/80 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <CreditCard size={20} className="text-emerald-400" />
            <span>Billing Profile</span>
          </h2>
          <p className="text-sm leading-relaxed text-stone-400">
            Manage your EcoGuide Pro subscriptions, tier features, and payment methods.
          </p>

          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-eco-500/10 bg-dark-900/50 p-5 sm:flex-row sm:items-center">
            <div>
              <span className="mb-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ACTIVE PLAN
              </span>
              <h3 className="text-base font-bold text-white">EcoGuide Free Tier</h3>
              <p className="mt-1 text-xs text-stone-500">
                Access to standard calculators, badges, and weekly coach tips.
              </p>
            </div>
            <button
              disabled
              className="cursor-not-allowed rounded-xl border border-stone-700 bg-stone-800 px-4 py-2 text-xs font-bold text-stone-500"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
