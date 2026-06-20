import { FAQItem } from './FAQItem';

interface FAQData {
  id: number;
  question: string;
  answer: string;
}

const faqList: FAQData[] = [
  {
    id: 1,
    question: 'How does the AI Coach work?',
    answer:
      'The AI Coach uses advanced machine learning models linked with your smart appliance APIs and utility rate schedules to identify optimized timings for energy usage. It suggests real-time optimizations, thermostat offsets, and appliance automation patterns to lower costs without compromising comfort.',
  },
  {
    id: 2,
    question: 'Is my smart home data secure?',
    answer:
      'Yes, data security is our top priority. We use bank-level AES-256 encryption for all database storage and secure TLS 1.3 tunnels for smart home APIs (like Nest or Tesla). We never sell your personal information or sharing-patterns to third parties.',
  },
  {
    id: 3,
    question: 'Do I need smart appliances to use EcoGuide AI?',
    answer:
      'No! While smart home integrations offer automated savings, you can absolutely use EcoGuide AI manually. Our AI Coach will send you recommendations and step-by-step guides for off-peak usage, bill optimization, and waste reductions.',
  },
  {
    id: 4,
    question: 'Can I connect my local utility provider?',
    answer:
      'We support integrations with over 150 major utility providers in North America and Europe, enabling automatic smart meter synchronization and rate plan detection. If your provider is not on the list, you can upload bills manually.',
  },
  {
    id: 5,
    question: 'How much can I expect to save?',
    answer:
      'Active users save an average of $280/year in utility costs. Users who connect their smart thermostats and Powerwalls typically save up to $410/year by automating peak-hour offsets and clean energy scheduling.',
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
    >
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-eco-500/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">FAQ</span>
          <h2 className="mt-3 font-serif text-3xl tracking-tight text-white md:text-5xl">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-light text-stone-400">
            Have questions about EcoGuide AI? We&apos;ve got answers.
          </p>
        </div>

        {/* FAQ List */}
        <div className="glass-card overflow-hidden rounded-2xl border border-eco-500/10 shadow-xl">
          {faqList.map((faq) => (
            <FAQItem key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
