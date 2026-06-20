'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Calculator, Thermometer, Car, Utensils, Info } from 'lucide-react';

type DietPattern = 'balanced' | 'vegetarian' | 'vegan';

export function ImpactSimulator() {
  const [tempOffset, setTempOffset] = useState(0);
  const [commute, setCommute] = useState(80);
  const [diet, setDiet] = useState<DietPattern>('balanced');

  const [footprint, setFootprint] = useState(5.2);
  const [savings, setSavings] = useState(340);

  // Recalculate impact dynamically based on lifestyle configurations
  useEffect(() => {
    // Baseline carbon footprint is around 6.0 tons CO2/yr for our user
    const baseFootprint = 6.0;

    // Temp offset impact: +/- 0.15 tons per degree
    const tempCarbon = tempOffset * 0.15;

    // Commute carbon impact: 0.018 tons per mile weekly
    const commuteCarbon = (commute - 80) * 0.018;

    // Diet carbon impact relative to balanced
    let dietCarbon = 0;
    if (diet === 'vegetarian') dietCarbon = -1.5;
    if (diet === 'vegan') dietCarbon = -2.3;

    const calculatedFootprint = Math.max(
      0.5,
      baseFootprint + tempCarbon + commuteCarbon + dietCarbon,
    );
    setFootprint(calculatedFootprint);

    // Baseline savings is $300/yr
    const baseSavings = 300;

    // Temp offset savings: positive savings for lowering thermostat in winter / raising in summer (- tempOffset)
    const tempSavings = -tempOffset * 22;

    // Commute savings: negative savings for more miles
    const commuteSavings = -(commute - 80) * 0.95;

    // Diet savings
    let dietSavings = 0;
    if (diet === 'vegetarian') dietSavings = 110;
    if (diet === 'vegan') dietSavings = 160;

    const calculatedSavings = Math.max(0, baseSavings + tempSavings + commuteSavings + dietSavings);
    setSavings(calculatedSavings);
  }, [tempOffset, commute, diet]);

  const handleScrollToCTA = () => {
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="analytics"
      className="relative overflow-hidden border-t border-eco-500/10 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 py-20 md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left Column: Interactive Calculator Panel */}
          <div className="w-full">
            <div className="glass-card rounded-2xl border border-eco-500/15 p-8 shadow-2xl">
              <div className="mb-8 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-eco-400" />
                <span className="text-sm font-semibold uppercase tracking-wider text-eco-400">
                  Impact Estimator
                </span>
              </div>

              {/* Temperature Slider */}
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="temp-slider"
                    className="flex items-center gap-2 text-sm font-medium text-stone-300"
                  >
                    <Thermometer className="h-4 w-4 text-amber-400" />
                    Temperature Offset
                  </label>
                  <span id="temp-value" className="text-sm font-semibold text-amber-400">
                    {tempOffset > 0 ? `+${tempOffset}` : tempOffset}°F
                  </span>
                </div>
                <input
                  id="temp-slider"
                  type="range"
                  min="-10"
                  max="10"
                  value={tempOffset}
                  onChange={(e) => setTempOffset(Number(e.target.value))}
                  aria-valuemin={-10}
                  aria-valuemax={10}
                  aria-valuenow={tempOffset}
                  aria-valuetext={`${tempOffset} degrees Fahrenheit`}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-eco-500/15"
                />
                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-stone-500">
                  <span>-10°F (Cooler)</span>
                  <span>0°F</span>
                  <span>+10°F (Warmer)</span>
                </div>
              </div>

              {/* Commute Slider */}
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="commute-slider"
                    className="flex items-center gap-2 text-sm font-medium text-stone-300"
                  >
                    <Car className="h-4 w-4 text-blue-400" />
                    Weekly Commute
                  </label>
                  <span id="commute-value" className="text-sm font-semibold text-blue-400">
                    {commute} mi
                  </span>
                </div>
                <input
                  id="commute-slider"
                  type="range"
                  min="0"
                  max="300"
                  value={commute}
                  onChange={(e) => setWarmCommute(e)}
                  aria-valuemin={0}
                  aria-valuemax={300}
                  aria-valuenow={commute}
                  aria-valuetext={`${commute} miles weekly`}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-eco-500/15"
                />
                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-stone-500">
                  <span>0 mi</span>
                  <span>150 mi</span>
                  <span>300 mi</span>
                </div>
              </div>

              {/* Diet Selection */}
              <div className="mb-8">
                <span className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-300">
                  <Utensils className="h-4 w-4 text-eco-400" />
                  Diet Pattern
                </span>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="group"
                  aria-label="Select diet pattern"
                >
                  {(['balanced', 'vegetarian', 'vegan'] as DietPattern[]).map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setDiet(pattern)}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        diet === pattern
                          ? 'border-eco-500/30 bg-eco-500/15 text-eco-400'
                          : 'border-stone-700 bg-dark-600 text-stone-400 hover:border-eco-500/30 hover:text-stone-300'
                      } capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Results */}
              <div className="space-y-4 border-t border-eco-500/10 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Estimated Footprint
                  </span>
                  <span
                    id="footprint-result"
                    className="font-serif text-lg font-semibold text-white md:text-xl"
                  >
                    {footprint.toFixed(1)}{' '}
                    <span className="font-sans text-xs text-stone-500">Tons CO₂/yr</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    ROI Estimate
                  </span>
                  <span
                    id="roi-result"
                    className="font-serif text-lg font-semibold text-eco-400 md:text-xl"
                  >
                    Save up to ${Math.round(savings)}
                    <span className="font-sans text-xs font-medium text-eco-500">/yr</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Informative Copy */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
              Carbon Simulator
            </span>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-white md:text-4xl">
              Simulate Your Carbon & <span className="text-gradient">Utility Savings</span>
            </h2>
            <p className="mt-5 font-light leading-relaxed text-stone-400">
              Adjust your lifestyle parameters and instantly see how changes impact your carbon
              footprint and annual savings. Our model uses EPA data and real utility rates.
            </p>
            <div className="mt-6 rounded-xl border border-eco-500/10 bg-eco-500/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-eco-400" />
                <p className="text-sm font-light leading-relaxed text-stone-400">
                  Average active users save over <strong className="text-eco-400">$280/year</strong>{' '}
                  by following AI recommendations. Top savers reduce their carbon by 40%.
                </p>
              </div>
            </div>
            <button
              onClick={handleScrollToCTA}
              className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            >
              <Calculator className="h-4 w-4" />
              <span>Calculate My Carbon Impact</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  function setWarmCommute(e: ChangeEvent<HTMLInputElement>) {
    setCommute(Number(e.target.value));
  }
}
