import { BarChart3 } from 'lucide-react';
export default function LMReports() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-ink">Lead Reports</h1>
          <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
            <BarChart3 size={13} className="text-brand-magenta" />
            Measure lead performance
          </p>
        </div>
      </div>
      <div className="card !p-10 flex flex-col items-center justify-center text-center">
        <p className="text-brand-ink/50">This page is coming soon.</p>
      </div>
    </div>
  );
}