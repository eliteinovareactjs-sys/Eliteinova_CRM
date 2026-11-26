import { Search } from 'lucide-react';

export default function LeadAdvancedSearch() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-ink">
            Lead Search & Advanced Filters
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
            <Search size={13} className="text-brand-magenta" />
            Find leads using advanced search criteria and filters
          </p>
        </div>
      </div>

      <div className="card !p-10 flex flex-col items-center justify-center text-center">
        <p className="text-brand-ink/50">
          Lead Search & Advanced Filters page is under construction.
        </p>
      </div>
    </div>
  );
}