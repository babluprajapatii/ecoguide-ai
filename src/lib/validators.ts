import { z } from 'zod';

/**
 * Reusable and centralized Zod validator schemas for common input fields
 * to eliminate duplicate validation logic across the project.
 */

export const emailValidator = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const loginPasswordValidator = z.string().min(1, 'Password is required');

export const passwordValidator = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/\d/, 'Password must contain at least 1 number');
