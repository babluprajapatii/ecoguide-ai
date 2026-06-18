/**
 * Zod validation schemas for the Community & Leaderboard feature.
 *
 * Validates leaderboard query parameters, community settings updates,
 * and bio content.
 *
 * @module community.schemas
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Leaderboard Query Params
// ---------------------------------------------------------------------------

export const leaderboardQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(5).max(50)),
  view: z.enum(['global', 'nearby', 'top']).optional().default('global'),
});

export type LeaderboardQueryParams = z.infer<typeof leaderboardQuerySchema>;

// ---------------------------------------------------------------------------
// Community Settings
// ---------------------------------------------------------------------------

/** Strip ASCII control characters from strings. */
// eslint-disable-next-line no-control-regex
const sanitizedString = z.string().transform((s) => s.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim());

export const communitySettingsSchema = z.object({
  optIn: z.boolean(),
  leaderboardOptIn: z.boolean(),
  publicProfileVisibility: z.enum(['public', 'hidden']),
  bio: sanitizedString.pipe(z.string().max(200, 'Bio must be 200 characters or fewer')),
});

export type CommunitySettingsInput = z.infer<typeof communitySettingsSchema>;
