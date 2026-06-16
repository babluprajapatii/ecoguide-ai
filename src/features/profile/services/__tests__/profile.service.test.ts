/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile, uploadAvatar } from '../profile.service';

// Create Supabase Mock interfaces
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: vi.fn(() => ({
      from: mockFrom,
      storage: {
        from: mockStorageFrom,
      },
    })),
  };
});

describe('profile.service operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up standard builder mock returns
    mockFrom.mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });
  });

  describe('updateProfile', () => {
    it('sends database updates successfully', async () => {
      mockEq.mockResolvedValue({ error: null });

      await expect(
        updateProfile('user-123', { displayName: 'New Name' })
      ).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: 'New Name',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('throws error when database mutation fails', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Database error' } });

      await expect(
        updateProfile('user-123', { displayName: 'Fail' })
      ).rejects.toThrow('Failed to update profile: Database error');
    });
  });

  describe('uploadAvatar validations & path checks', () => {
    it('throws error for invalid MIME type (Layer 2)', async () => {
      const mockFile = new File(['mock content'], 'avatar.gif', {
        type: 'image/gif',
      });

      await expect(uploadAvatar('user-123', mockFile)).rejects.toThrow(
        'Invalid file type: only JPEG, PNG, and WebP are allowed.'
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('throws error for file exceeding 2MB size limit (Layer 2)', async () => {
      // 2.1 MB file
      const largeBlob = new Uint8Array(2.1 * 1024 * 1024);
      const mockFile = new File([largeBlob], 'avatar.png', {
        type: 'image/png',
      });

      await expect(uploadAvatar('user-123', mockFile)).rejects.toThrow(
        'File exceeds 2MB limit.'
      );
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('uploads to path avatars/{user_id}/avatar.webp and returns public url', async () => {
      const mockFile = new File(['avatar content'], 'avatar.jpg', {
        type: 'image/jpeg',
      });

      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.com/avatars/user-123/avatar.webp' },
      });

      const url = await uploadAvatar('user-123', mockFile);

      expect(url).toBe('https://supabase.com/avatars/user-123/avatar.webp');
      expect(mockStorageFrom).toHaveBeenCalledWith('avatars');
      expect(mockUpload).toHaveBeenCalledWith(
        'user-123/avatar.webp',
        mockFile,
        expect.objectContaining({
          upsert: true,
          contentType: 'image/webp',
        })
      );
    });

    it('throws error when storage uploader fails', async () => {
      const mockFile = new File(['content'], 'avatar.png', {
        type: 'image/png',
      });

      mockUpload.mockResolvedValue({ error: { message: 'Upload timeout' } });

      await expect(uploadAvatar('user-123', mockFile)).rejects.toThrow(
        'Failed to upload avatar: Upload timeout'
      );
    });
  });
});
