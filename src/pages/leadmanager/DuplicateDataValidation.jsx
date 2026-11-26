import { ShieldCheck } from 'lucide-react';

export default function DuplicateDataValidation() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-ink">
            Duplicate & Data Validation
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
            <ShieldCheck size={13} className="text-brand-magenta" />
            Detect duplicate records and maintain accurate lead information
          </p>
        </div>
      </div>

      <div className="card !p-10 flex flex-col items-center justify-center text-center">
        <p className="text-brand-ink/50">
          Duplicate & Data Validation page is coming soon.
        </p>
      </div>
    </div>
  );
}