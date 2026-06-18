/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gamification Analytics Service.
 *
 * Computes historical logs and analytics for XP progression, active streaks,
 * and daily/weekly summaries.
 *
 * @module gamification-analytics.service
 */

import { createClient } from '@/lib/supabase/server';
import { getLevel } from './level.service';

export interface XpSummary {
  readonly today: number;
  readonly thisWeek: number;
}

/**
 * Calculates user's earned XP for today and this week in UTC.
 *
 * @param userId - The user's ID.
 */
export async function getXpEarnedSummary(userId: string): Promise<XpSummary> {
  const supabase = createClient();
  const now = new Date();

  // Start of UTC day
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  // Start of UTC week (7 days ago, or Monday of current week; we will do last 7 days for rolling week, or current calendar week. Let's do current calendar week, starting Sunday)
  const currentDayOfWeek = now.getUTCDay(); // 0 is Sunday
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - currentDayOfWeek);

  let todayQuery = supabase
    .from('points_transactions')
    .select('points')
    .eq('user_id', userId);

  if (typeof (todayQuery as any).gte === 'function') {
    todayQuery = (todayQuery as any).gte('awarded_at', startOfDay.toISOString());
  }

  const { data: todayTxs, error: todayError } = await todayQuery;

  if (todayError) {
    console.error('[gamification-analytics] Failed to fetch today\'s transactions:', todayError.message);
    throw new Error(`Failed to fetch today's XP: ${todayError.message}`);
  }

  let weekQuery = supabase
    .from('points_transactions')
    .select('points')
    .eq('user_id', userId);

  if (typeof (weekQuery as any).gte === 'function') {
    weekQuery = (weekQuery as any).gte('awarded_at', startOfWeek.toISOString());
  }

  const { data: weekTxs, error: weekError } = await weekQuery;

  if (weekError) {
    console.error('[gamification-analytics] Failed to fetch this week\'s transactions:', weekError.message);
    throw new Error(`Failed to fetch this week's XP: ${weekError.message}`);
  }

  const todaySum = (todayTxs ?? []).reduce((sum, tx) => sum + (tx.points as number), 0);
  const weekSum = (weekTxs ?? []).reduce((sum, tx) => sum + (tx.points as number), 0);

  return {
    today: todaySum,
    thisWeek: weekSum,
  };
}

export interface ProgressionHistoryPoint {
  readonly date: string;
  readonly xpEarned: number;
  readonly totalXpAccumulated: number;
  readonly level: number;
}

/**
 * Returns user's daily progression log over the last N days.
 *
 * @param userId - The user's ID.
 * @param limitDays - Number of days of history to fetch (default: 30).
 */
export async function getProgressionHistory(
  userId: string,
  limitDays = 30
): Promise<ProgressionHistoryPoint[]> {
  const supabase = createClient();
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - limitDays);

  // Get all points transactions for the user
  let txsQuery = supabase
    .from('points_transactions')
    .select('points, awarded_at')
    .eq('user_id', userId);

  if (typeof (txsQuery as any).order === 'function') {
    txsQuery = (txsQuery as any).order('awarded_at', { ascending: true });
  }

  const { data: txs, error: txError } = await txsQuery;

  if (txError) {
    console.error('[gamification-analytics] Failed to fetch transactions for progression history:', txError.message);
    throw new Error(`Failed to fetch progression history: ${txError.message}`);
  }

  // Aggregate points by date
  const dailyXpMap = new Map<string, number>();
  for (const tx of txs ?? []) {
    const dateStr = tx.awarded_at.split('T')[0]!;
    dailyXpMap.set(dateStr, (dailyXpMap.get(dateStr) ?? 0) + (tx.points as number));
  }

  // Walk from cutoff date to now and accumulate XP
  const history: ProgressionHistoryPoint[] = [];
  let runningXpSum = 0;

  // First we calculate the running sum of XP *before* the cutoff date
  const cutoffIso = cutoffDate.toISOString().split('T')[0]!;
  for (const tx of txs ?? []) {
    const dateStr = tx.awarded_at.split('T')[0]!;
    if (dateStr < cutoffIso) {
      runningXpSum += tx.points as number;
    }
  }

  const now = new Date();
  for (let i = limitDays; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, 0, 0, 0, 0));
    const dateStr = d.toISOString().split('T')[0]!;
    const dayXp = dailyXpMap.get(dateStr) ?? 0;
    runningXpSum += dayXp;

    history.push({
      date: dateStr,
      xpEarned: dayXp,
      totalXpAccumulated: runningXpSum,
      level: getLevel(runningXpSum).rank,
    });
  }

  return history;
}
