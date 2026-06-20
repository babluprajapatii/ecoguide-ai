export function LogoCloud() {
  return (
    <div className="mt-20 border-t border-eco-500/5 pt-12">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        Trusted by Smart Grid Partners
      </p>
      <div
        className="flex select-none flex-wrap items-center justify-center gap-8 opacity-40 md:gap-14"
        aria-label="Smart Grid Partners: SmartGrid, Nest, Tesla, Enphase, SolarEdge"
      >
        <span className="text-sm font-bold tracking-wider text-stone-300 transition-all duration-300 hover:text-eco-400 hover:opacity-100 md:text-base">
          SMARTGRID
        </span>
        <span className="text-sm font-bold tracking-wider text-stone-300 transition-all duration-300 hover:text-eco-400 hover:opacity-100 md:text-base">
          NEST
        </span>
        <span className="text-sm font-bold tracking-wider text-stone-300 transition-all duration-300 hover:text-eco-400 hover:opacity-100 md:text-base">
          TESLA
        </span>
        <span className="text-sm font-bold tracking-wider text-stone-300 transition-all duration-300 hover:text-eco-400 hover:opacity-100 md:text-base">
          ENPHASE
        </span>
        <span className="text-sm font-bold tracking-wider text-stone-300 transition-all duration-300 hover:text-eco-400 hover:opacity-100 md:text-base">
          SOLAREDGE
        </span>
      </div>
    </div>
  );
}
