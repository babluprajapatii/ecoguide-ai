'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CoachInterface } from './CoachInterface';
import { CoachStats } from './CoachStats';
import { ActionPlans } from './ActionPlans';
import { Loader2 } from 'lucide-react';

interface CoachClientProps {
  readonly highestCategory: string;
}

export function CoachClient({ highestCategory }: CoachClientProps) {
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSelectPrompt = (prompt: string) => {
    setExternalPrompt(prompt);
  };

  useEffect(() => {
    if (loading || !user) return;

    const savedPreview = localStorage.getItem('ecoguide_assessment_result_preview');
    if (!savedPreview) return;

    const syncPreviewAssessment = async () => {
      setIsSyncing(true);
      try {
        const parsed = JSON.parse(savedPreview);
        if (parsed && parsed.inputs) {
          const response = await fetch('/api/assessment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsed.inputs),
          });
          if (response.ok) {
            localStorage.removeItem('ecoguide_assessment_result_preview');
            // Refresh to update highestCategory server-side
            router.refresh();
          }
        }
      } catch (err) {
        console.error('[CoachClient] Failed to sync local assessment preview:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    void syncPreviewAssessment();
  }, [user, loading, router]);

  return (
    <div className="relative">
      {isSyncing && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-emerald-300">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Syncing your completed carbon footprint assessment...</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Stats Cards, Recommendations Checklist, and Action Plan Roadmaps */}
        <div className="space-y-6 lg:col-span-7">
          <CoachStats />
          <ActionPlans onSelectPrompt={handleSelectPrompt} isStreaming={false} />
        </div>

        {/* Right Column: Chat Assistant Console */}
        <div className="lg:sticky lg:top-20 lg:col-span-5">
          <CoachInterface
            highestCategory={highestCategory}
            externalPromptTrigger={externalPrompt}
            onClearExternalPrompt={() => setExternalPrompt(null)}
          />
        </div>
      </div>
    </div>
  );
}
export default CoachClient;
