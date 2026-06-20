import { createClient } from '@/lib/supabase/client';

export interface ProfileUpdateInput {
  displayName?: string | null;
  avatarUrl?: string | null;
}

// Hardened validation constants
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * Service to manage user profile state mutations in the public.profiles table.
 */
export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName,
      avatar_url: input.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Service to handle profile picture uploads to Supabase Storage avatars bucket.
 *
 * Implements:
 * 1. Service-layer MIME type checks and file size limits (2MB).
 * 2. Target folder path constraints (avatars/{user_id}/avatar.webp).
 * 3. Exception propagation on rejection.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Service-layer validation (Layer 2)
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type: only JPEG, PNG, and WebP are allowed.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds 2MB limit.');
  }

  const supabase = createClient();

  // Path structure: avatars/{user_id}/avatar.webp
  // We normalize extensions or keep the matches. Using .webp or file-ext is supported.
  // Standardizing to avatar.webp ensures profile clean ups.
  const filePath = `${userId}/avatar.webp`;

  // Upload file to Supabase avatars storage bucket
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    upsert: true,
    contentType: 'image/webp',
  });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Retrieve the public read-only url
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrl;
}
