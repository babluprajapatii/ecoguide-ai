export function LogoCloud() {
  return (
    <div className="mt-20 border-t border-eco-500/5 pt-12">
      <p className="text-center text-stone-500 text-xs font-semibold tracking-[0.2em] uppercase mb-8">
        Trusted by Smart Grid Partners
      </p>
      <div 
        className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-40 select-none"
        aria-label="Smart Grid Partners: SmartGrid, Nest, Tesla, Enphase, SolarEdge"
      >
        <span className="text-stone-300 font-bold text-sm md:text-base tracking-wider hover:text-eco-400 hover:opacity-100 transition-all duration-300">
          SMARTGRID
        </span>
        <span className="text-stone-300 font-bold text-sm md:text-base tracking-wider hover:text-eco-400 hover:opacity-100 transition-all duration-300">
          NEST
        </span>
        <span className="text-stone-300 font-bold text-sm md:text-base tracking-wider hover:text-eco-400 hover:opacity-100 transition-all duration-300">
          TESLA
        </span>
        <span className="text-stone-300 font-bold text-sm md:text-base tracking-wider hover:text-eco-400 hover:opacity-100 transition-all duration-300">
          ENPHASE
        </span>
        <span className="text-stone-300 font-bold text-sm md:text-base tracking-wider hover:text-eco-400 hover:opacity-100 transition-all duration-300">
          SOLAREDGE
        </span>
      </div>
    </div>
  );
}
