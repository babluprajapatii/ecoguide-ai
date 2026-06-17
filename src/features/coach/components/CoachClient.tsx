'use client';

import { useState } from 'react';
import { CoachInterface } from './CoachInterface';
import { CoachStats } from './CoachStats';
import { ActionPlans } from './ActionPlans';

interface CoachClientProps {
  readonly highestCategory: string;
}

export function CoachClient({ highestCategory }: CoachClientProps) {
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  const handleSelectPrompt = (prompt: string) => {
    setExternalPrompt(prompt);
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
      {/* Left Column: Stats Cards, Recommendations Checklist, and Action Plan Roadmaps */}
      <div className="lg:col-span-7 space-y-6">
        <CoachStats />
        <ActionPlans onSelectPrompt={handleSelectPrompt} isStreaming={false} />
      </div>

      {/* Right Column: Chat Assistant Console */}
      <div className="lg:col-span-5 lg:sticky lg:top-20">
        <CoachInterface
          highestCategory={highestCategory}
          externalPromptTrigger={externalPrompt}
          onClearExternalPrompt={() => setExternalPrompt(null)}
        />
      </div>
    </div>
  );
}
export default CoachClient;
