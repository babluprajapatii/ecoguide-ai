import { z } from 'zod';

/**
 * Regex that matches common HTML tag patterns.
 * Used to reject input containing HTML to prevent XSS.
 */
const HTML_TAG_REGEX = /<[^>]*>/;

/**
 * Schema for validating email/password sign-in credentials.
 *
 * - `email`: Must be a valid email format.
 * - `password`: Between 8 and 128 characters.
 */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

/** Inferred TypeScript type for sign-in form data. */
export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Schema for validating sign-up credentials.
 *
 * Extends `signInSchema` with:
 * - `displayName`: Between 2 and 50 characters, no HTML tags allowed.
 */
export const signUpSchema = signInSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .refine(
      (value) => !HTML_TAG_REGEX.test(value),
      'Display name must not contain HTML',
    ),
});

/** Inferred TypeScript type for sign-up form data. */
export type SignUpFormData = z.infer<typeof signUpSchema>;
