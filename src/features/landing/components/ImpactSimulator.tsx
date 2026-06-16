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
    
    const calculatedFootprint = Math.max(0.5, baseFootprint + tempCarbon + commuteCarbon + dietCarbon);
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
    <section id="analytics" className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 border-t border-eco-500/10">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Interactive Calculator Panel */}
          <div className="w-full">
            <div className="glass-card rounded-2xl p-8 shadow-2xl border border-eco-500/15">
              <div className="flex items-center gap-2 mb-8">
                <Calculator className="text-eco-400 w-5 h-5" />
                <span className="text-sm font-semibold text-eco-400 tracking-wider uppercase">
                  Impact Estimator
                </span>
              </div>

              {/* Temperature Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="temp-slider" className="text-sm text-stone-300 flex items-center gap-2 font-medium">
                    <Thermometer className="text-amber-400 w-4 h-4" />
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
                  className="w-full h-1 bg-eco-500/15 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
                  <span>-10°F (Cooler)</span>
                  <span>0°F</span>
                  <span>+10°F (Warmer)</span>
                </div>
              </div>

              {/* Commute Slider */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="commute-slider" className="text-sm text-stone-300 flex items-center gap-2 font-medium">
                    <Car className="text-blue-400 w-4 h-4" />
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
                  className="w-full h-1 bg-eco-500/15 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
                  <span>0 mi</span>
                  <span>150 mi</span>
                  <span>300 mi</span>
                </div>
              </div>

              {/* Diet Selection */}
              <div className="mb-8">
                <span className="text-sm text-stone-300 flex items-center gap-2 mb-3 font-medium">
                  <Utensils className="text-eco-400 w-4 h-4" />
                  Diet Pattern
                </span>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Select diet pattern">
                  {(['balanced', 'vegetarian', 'vegan'] as DietPattern[]).map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setDiet(pattern)}
                      type="button"
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        diet === pattern
                          ? 'bg-eco-500/15 text-eco-400 border-eco-500/30'
                          : 'bg-dark-600 text-stone-400 border-stone-700 hover:border-eco-500/30 hover:text-stone-300'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 capitalize`}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Results */}
              <div className="border-t border-eco-500/10 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-xs font-semibold tracking-wider uppercase">
                    Estimated Footprint
                  </span>
                  <span id="footprint-result" className="text-lg md:text-xl font-serif font-semibold text-white">
                    {footprint.toFixed(1)} <span className="text-xs text-stone-500 font-sans">Tons CO₂/yr</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 text-xs font-semibold tracking-wider uppercase">
                    ROI Estimate
                  </span>
                  <span id="roi-result" className="text-lg md:text-xl font-serif font-semibold text-eco-400">
                    Save up to ${Math.round(savings)}
                    <span className="text-xs text-eco-500 font-sans font-medium">/yr</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Informative Copy */}
          <div>
            <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
              Carbon Simulator
            </span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mt-3 text-white leading-tight">
              Simulate Your Carbon & <span className="text-gradient">Utility Savings</span>
            </h2>
            <p className="text-stone-400 mt-5 font-light leading-relaxed">
              Adjust your lifestyle parameters and instantly see how changes impact your carbon footprint and annual savings. Our model uses EPA data and real utility rates.
            </p>
            <div className="mt-6 p-4 rounded-xl bg-eco-500/5 border border-eco-500/10">
              <div className="flex items-start gap-3">
                <Info className="text-eco-400 w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-stone-400 text-sm font-light leading-relaxed">
                  Average active users save over <strong className="text-eco-400">$280/year</strong> by following AI recommendations. Top savers reduce their carbon by 40%.
                </p>
              </div>
            </div>
            <button
              onClick={handleScrollToCTA}
              className="btn-primary mt-8 text-sm font-semibold text-white px-7 py-3.5 rounded-full tracking-wide inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            >
              <Calculator className="w-4 h-4" />
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
