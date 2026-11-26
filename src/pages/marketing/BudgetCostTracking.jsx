
// src/pages/marketing/BudgetCostTracking.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, AlertCircle, CheckCircle2, Target, TrendingUp,
  Calendar, Inbox, Activity, DollarSign, Megaphone,
  BarChart3, Percent, Award, Wallet, PiggyBank, Receipt, Coins,
  Clock, TrendingDown, UserCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, AreaChart, Area,
} from 'recharts';
// import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   MODULE-LEVEL CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CHART_COLORS = ['#E31C79', '#8B2FD6', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];

const STORAGE_KEY = 'budget:marketing';

const TABS = [
  { key: 'overview', label: 'Budget Overview',   icon: Wallet },
  { key: 'spend',    label: 'Campaign Spending', icon: Receipt },
  { key: 'cost',     label: 'Cost Efficiency',   icon: Coins },
  { key: 'daily',    label: 'Daily Spend',       icon: Clock },
];

const CHART_VIEWS = [
  { key: 'bars', label: 'Bars' },
  { key: 'flow', label: 'Flow' },
];

const KPI_THEMES = {
  purple:  { border: 'border-violet-200 hover:border-violet-400', bg: 'from-violet-50 via-violet-50/30 to-white', iconBg: 'bg-violet-100 text-brand-purple border-violet-200', bar: 'from-brand-purple to-brand-magenta', glow: 'bg-brand-purple/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(139,47,214,0.45)]', valueColor: 'text-brand-purple' },
  emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'from-emerald-50 via-emerald-50/30 to-white', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200', bar: 'from-emerald-500 to-emerald-400', glow: 'bg-emerald-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.4)]', valueColor: 'text-emerald-600' },
  amber:   { border: 'border-amber-200 hover:border-amber-400', bg: 'from-amber-50 via-amber-50/30 to-white', iconBg: 'bg-amber-100 text-amber-600 border-amber-200', bar: 'from-amber-500 to-orange-400', glow: 'bg-amber-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(245,158,11,0.4)]', valueColor: 'text-amber-600' },
  rose:    { border: 'border-rose-200 hover:border-rose-400', bg: 'from-rose-50 via-rose-50/30 to-white', iconBg: 'bg-rose-100 text-brand-magenta border-rose-200', bar: 'from-brand-magenta to-brand-purple', glow: 'bg-brand-magenta/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(227,28,121,0.45)]', valueColor: 'text-brand-magenta' },
};

const METRIC_TILE_COLORS = {
  purple:  'bg-violet-50 text-brand-purple border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber:   'bg-amber-50 text-amber-600 border-amber-200',
  rose:    'bg-rose-50 text-brand-magenta border-rose-200',
};

const METRIC_CARD_COLORS = {
  purple:  'text-brand-purple',
  emerald: 'text-emerald-600',
  rose:    'text-brand-magenta',
  amber:   'text-amber-600',
};

const COST_CARD_TONES = {
  purple:  { fg: 'text-brand-purple',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  emerald: { fg: 'text-emerald-600',   bg: 'bg-emerald-50', border: 'border-emerald-200' },
  amber:   { fg: 'text-amber-600',     bg: 'bg-amber-50',   border: 'border-amber-200' },
  rose:    { fg: 'text-brand-magenta', bg: 'bg-rose-50',    border: 'border-rose-200' },
};

const COST_ROW_TONES = {
  purple:  'text-brand-purple',
  emerald: 'text-emerald-600',
  rose:    'text-brand-magenta',
  amber:   'text-amber-600',
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const toSafeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    typeof value === 'boolean'
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
};

const normalizeCampaign = (campaign) => {
  if (
    !campaign ||
    typeof campaign !== 'object' ||
    Array.isArray(campaign) ||
    campaign.id === null ||
    campaign.id === undefined ||
    !String(campaign.id).trim() ||
    typeof campaign.name !== 'string' ||
    !campaign.name.trim()
  ) {
    return null;
  }

  return {
    ...campaign,

    id: String(campaign.id).trim(),
    name: campaign.name.trim(),

    project: typeof campaign.project === 'string'
      ? campaign.project.trim()
      : '',

    type: typeof campaign.type === 'string'
      ? campaign.type.trim()
      : '',

    channel: typeof campaign.channel === 'string'
      ? campaign.channel.trim()
      : '',

    budget: toSafeNumber(campaign.budget),
    plannedSpend: toSafeNumber(campaign.plannedSpend),
    actualSpend: toSafeNumber(campaign.actualSpend),
    dailySpend: toSafeNumber(campaign.dailySpend),

    leads: toSafeNumber(campaign.leads),
    validLeads: toSafeNumber(campaign.validLeads),
    qualified: toSafeNumber(campaign.qualified),
    converted: toSafeNumber(campaign.converted),
    revenue: toSafeNumber(campaign.revenue),
  };
};

const getUniqueCampaigns = (campaigns) => {
  const campaignMap = new Map();

  campaigns.forEach((campaign) => {
    if (!campaignMap.has(campaign.id)) {
      campaignMap.set(campaign.id, campaign);
    }
  });

  return Array.from(campaignMap.values());
};

const loadState = (fallback) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    const normalized = parsed
      .map(normalizeCampaign)
      .filter(Boolean);

    return getUniqueCampaigns(normalized);
  } catch (error) {
    console.error('Failed to load budget data:', error);
    return fallback;
  }
};

const saveState = (value) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* ignore */ }
};

const formatCurrency = (n) => {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe < 0 ? '-₹' : '₹'}${Math.abs(safe).toLocaleString('en-IN')}`;
};

const formatCurrencyPrecise = (n) => {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe < 0 ? '-₹' : '₹'}${Math.abs(safe).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (n) => {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
};

/* ═══════════════════════════════════════════════════════════════
   SEED DATA — all values in INR
   ═══════════════════════════════════════════════════════════════ */
const SEED_CAMPAIGNS = [
  {
    id: 'cmp-1', name: 'Summer Campaign', type: 'Promotion', channel: 'Google Ads', project: 'Eliteinova Matrimony',
    budget: 500000, plannedSpend: 500000, actualSpend: 480000, dailySpend: 16000,
    leads: 100, validLeads: 80, qualified: 20, converted: 10, revenue: 1500000,
  },
  {
    id: 'cmp-2', name: 'Google Search - CRM', type: 'Lead Generation', channel: 'Google Ads', project: 'Eliteinova CRM',
    budget: 300000, plannedSpend: 300000, actualSpend: 310000, dailySpend: 10000,
    leads: 120, validLeads: 95, qualified: 30, converted: 15, revenue: 2250000,
  },
  {
    id: 'cmp-3', name: 'Facebook Awareness', type: 'Brand Awareness', channel: 'Facebook', project: 'Eliteinova Matrimony',
    budget: 150000, plannedSpend: 150000, actualSpend: 90000, dailySpend: 5000,
    leads: 60, validLeads: 48, qualified: 8, converted: 3, revenue: 450000,
  },
  {
    id: 'cmp-4', name: 'Product Launch Q3', type: 'Product Launch', channel: 'LinkedIn', project: 'Eliteinova CRM',
    budget: 800000, plannedSpend: 800000, actualSpend: 820000, dailySpend: 27000,
    leads: 200, validLeads: 170, qualified: 60, converted: 30, revenue: 4500000,
  },
  {
    id: 'cmp-5', name: 'Diwali Festival Promo', type: 'Festival Campaign', channel: 'Meta Ads', project: 'Eliteinova Matrimony',
    budget: 450000, plannedSpend: 450000, actualSpend: 420000, dailySpend: 14000,
    leads: 150, validLeads: 125, qualified: 35, converted: 18, revenue: 2700000,
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BudgetCostTracking() {

  const [campaigns, setCampaigns] = useState(() => loadState(SEED_CAMPAIGNS));
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState('all');
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [chartView, setChartView] = useState('bars');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const hydratedRef = useRef(false);
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    saveState(campaigns);
  }, [campaigns]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY) return;

      if (event.newValue === null) {
        skipNextPersistRef.current = true;
        setCampaigns(SEED_CAMPAIGNS);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);

        if (!Array.isArray(parsed)) return;

        const normalized = parsed
          .map(normalizeCampaign)
          .filter(Boolean);

        const uniqueCampaigns = getUniqueCampaigns(normalized);

        skipNextPersistRef.current = true;
        setCampaigns(uniqueCampaigns);
      } catch (error) {
        console.error('Failed to sync budget data:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const selectedCampaign = useMemo(() => {
    if (selectedCampaignId === 'all') return null;
    return campaigns.find((campaign) => campaign.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    if (
      selectedCampaignId !== 'all' &&
      !campaigns.some((campaign) => campaign.id === selectedCampaignId)
    ) {
      setSelectedCampaignId('all');
    }
  }, [campaigns, selectedCampaignId]);

  const scopedCampaigns = useMemo(() => {
    if (selectedCampaignId === 'all') return campaigns;
    return campaigns.filter((c) => c.id === selectedCampaignId);
  }, [campaigns, selectedCampaignId]);

  const metrics = useMemo(() => {
    const totals = scopedCampaigns.reduce(
      (acc, campaign) => {
        acc.budget += toSafeNumber(campaign.budget);
        acc.plannedSpend += toSafeNumber(campaign.plannedSpend);
        acc.actualSpend += toSafeNumber(campaign.actualSpend);
        acc.dailySpend += toSafeNumber(campaign.dailySpend);
        acc.leads += toSafeNumber(campaign.leads);
        acc.validLeads += toSafeNumber(campaign.validLeads);
        acc.qualified += toSafeNumber(campaign.qualified);
        acc.converted += toSafeNumber(campaign.converted);
        acc.revenue += toSafeNumber(campaign.revenue);
        return acc;
      },
      {
        budget: 0, plannedSpend: 0, actualSpend: 0, dailySpend: 0,
        leads: 0, validLeads: 0, qualified: 0, converted: 0, revenue: 0,
      }
    );

    const {
      budget, plannedSpend, actualSpend, dailySpend,
      leads, validLeads, qualified, converted, revenue,
    } = totals;

    const profit = revenue - actualSpend;

    const variance = actualSpend - budget;

    const forecastVariance = actualSpend - plannedSpend;

    const utilization = budget > 0
      ? (actualSpend / budget) * 100
      : 0;

    const forecastVariancePercent = plannedSpend > 0
      ? (forecastVariance / plannedSpend) * 100
      : 0;

    const remainingBudget = Math.max(0, budget - actualSpend);

    const isOverBudget = actualSpend > budget;

    return {
      ...totals,

      profit,

      variance,
      forecastVariance,
      forecastVariancePercent,

      utilization,

      remainingBudget,
      isOverBudget,

      cpl: leads > 0
        ? actualSpend / leads
        : 0,

      cpValidLead: validLeads > 0
        ? actualSpend / validLeads
        : 0,

      cpql: qualified > 0
        ? actualSpend / qualified
        : 0,

      cpConv: converted > 0
        ? actualSpend / converted
        : 0,

      roi: actualSpend > 0
        ? (profit / actualSpend) * 100
        : 0,

      runway: dailySpend > 0 && remainingBudget > 0
        ? Math.ceil(remainingBudget / dailySpend)
        : null,

      dailyRunRate: dailySpend,
    };
  }, [scopedCampaigns]);

  const spendChartData = useMemo(() => {
    return scopedCampaigns.map((c) => ({
      name: c.name,
      planned: toSafeNumber(c.plannedSpend),
      actual: toSafeNumber(c.actualSpend),
    }));
  }, [scopedCampaigns]);

  const utilizationData = useMemo(() => {
    return scopedCampaigns.map((c) => {
      const used = toSafeNumber(c.actualSpend);
      const budget = toSafeNumber(c.budget);
      const remaining = Math.max(0, budget - used);
      const over = used > budget;
      const utilization = budget > 0 ? (used / budget) * 100 : 0;
      const status = budget <= 0 ? (used > 0 ? 'No budget allocated' : 'No budget') : over ? 'Over budget' : used === 0 ? 'Not spent' : 'Within budget';
      return {
        name: c.name,
        used,
        remaining,
        budget,
        overBy: over ? used - budget : 0,
        pct: budget > 0 ? Math.min(utilization, 100) : 0,
        actualPct: budget > 0 ? utilization : 0,
        over,
        status,
      };
    });
  }, [scopedCampaigns]);

  const dailySpendTrend = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      day: `Day ${i + 1}`,
      amount: metrics.dailySpend,
    }));
  }, [metrics.dailySpend]);

  const kpis = useMemo(() => ([
    { icon: Wallet,     label: 'Campaign Budget', value: formatCurrency(metrics.budget),      sub: 'Total allocated',                                color: 'purple',  delay: 0   },
    { icon: Receipt,    label: 'Actual Spend',    value: formatCurrency(metrics.actualSpend),   sub: `${formatPercent(metrics.utilization)} utilized`,  color: 'rose',    delay: 40  },
    { icon: PiggyBank,  label: 'Planned Spend',   value: formatCurrency(metrics.plannedSpend),  sub: 'Forecast',                                        color: 'amber',   delay: 80  },
    { icon: Clock,      label: 'Daily Spend',     value: formatCurrency(metrics.dailySpend),    sub: `${metrics.runway === null ? 'N/A' : `${metrics.runway} days`} runway`, color: 'purple', delay: 120 },
    { icon: TrendingUp, label: 'Marketing Contribution', value: formatCurrency(metrics.profit), sub: `${formatPercent(metrics.roi)} marketing spend ROI`, color: metrics.profit >= 0 ? 'emerald' : 'rose', delay: 160 },
  ]), [metrics]);

  const hasData = scopedCampaigns.length > 0;

  const handleSelectAllCampaigns = useCallback(() => { setSelectedCampaignId('all'); setCampaignOpen(false); }, []);
  const handleSelectCampaign = useCallback((id) => { setSelectedCampaignId(id); setCampaignOpen(false); }, []);
  const handleToggleCampaignOpen = useCallback(() => setCampaignOpen((o) => !o), []);
  const handleCloseCampaignMenu = useCallback(() => setCampaignOpen(false), []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FDF8FE] via-white to-[#FBF3FF]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-magenta/[0.05] blur-3xl" />
        <div className="absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-brand-purple/[0.05] blur-3xl" />
      </div>

      <div className="relative space-y-5 px-1 py-1 pb-40">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">Marketing Budget &amp; Cost Tracking</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <Wallet size={13} className="text-brand-magenta" />
              Monitor campaign spending and cost efficiency
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* <button
              onClick={handleExport}
              className="group inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-magenta/40 hover:shadow-md"
            >
              <Download size={14} className="transition-transform group-hover:translate-y-0.5" /> Export Report
            </button> */}

            <CampaignSelector
              campaigns={campaigns}
              selectedCampaignId={selectedCampaignId}
              selectedCampaign={selectedCampaign}
              isOpen={campaignOpen}
              onToggle={handleToggleCampaignOpen}
              onClose={handleCloseCampaignMenu}
              onSelect={handleSelectCampaign}
              onSelectAll={handleSelectAllCampaigns}
            />
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Budget Overview</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">
                {selectedCampaign ? selectedCampaign.name : `${scopedCampaigns.length} campaigns combined`}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {kpis.map((k, i) => (
              <KpiCard key={`${k.label}-${i}`} {...k} />
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="card !p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTab(t.key)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] scale-[1.02]'
                      : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'
                  }`}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        {!hasData ? (
          <EmptyState message="No campaigns found for this selection" />
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab metrics={metrics} utilizationData={utilizationData} />}
            {activeTab === 'spend'    && <SpendTab    metrics={metrics} spendChartData={spendChartData} chartView={chartView} setChartView={setChartView} scopedCampaigns={scopedCampaigns} />}
            {activeTab === 'cost'     && <CostTab     metrics={metrics} />}
            {activeTab === 'daily'    && <DailyTab    metrics={metrics} dailySpendTrend={dailySpendTrend} />}
          </>
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAMPAIGN SELECTOR
   ═══════════════════════════════════════════════════════════════ */
const CampaignSelector = memo(function CampaignSelector({
  campaigns, selectedCampaignId, selectedCampaign, isOpen,
  onToggle, onClose, onSelect, onSelectAll,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Select campaign. Current selection: ${selectedCampaign ? selectedCampaign.name : 'All Campaigns'}`}
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-lilac/40 focus:outline-none focus:ring-2 focus:ring-brand-magenta/40"
      >
        <Megaphone size={14} className="text-brand-magenta" />
        Campaign:
        <span className="max-w-[160px] truncate font-bold text-brand-magenta">
          {selectedCampaign ? selectedCampaign.name : 'All Campaigns'}
        </span>
        <ChevronDown size={14} className={`text-brand-ink/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden="true" />
          <div className="absolute right-0 top-full z-30 mt-2 max-h-72 w-64 overflow-y-auto no-scrollbar rounded-xl border border-brand-lilac bg-white p-1 shadow-panel" role="menu" aria-label="Campaign options">
            <button
              type="button"
              role="menuitem"
              onClick={onSelectAll}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                selectedCampaignId === 'all'
                  ? 'bg-brand-magenta/10 text-brand-magenta'
                  : 'text-brand-ink/70 hover:bg-brand-lilac/40'
              }`}
            >
              All Campaigns
            </button>
            {campaigns.map((c) => (
              <button
                type="button"
                role="menuitem"
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedCampaignId === c.id
                    ? 'bg-brand-magenta/10 font-semibold text-brand-magenta'
                    : 'text-brand-ink/70 hover:bg-brand-lilac/40'
                }`}
              >
                <p className="truncate font-semibold">{c.name}</p>
                <p className="truncate font-mono text-[10px] opacity-60">{c.project}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ─────────── BUDGET OVERVIEW TAB ─────────── */
const OverviewTab = memo(function OverviewTab({ metrics, utilizationData }) {
  return (
    <div className="space-y-5">
      {/* Cost summary cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <CostCard icon={Wallet}    label="Campaign Budget" value={formatCurrency(metrics.budget)}      formula="Total allocated budget"       tone="purple" />
        <CostCard icon={Receipt}   label="Actual Spend"    value={formatCurrency(metrics.actualSpend)}  formula={`${formatPercent(metrics.utilization)} of budget used`} tone="rose" />
        <CostCard icon={PiggyBank} label="Planned Spend"   value={formatCurrency(metrics.plannedSpend)} formula="Forecasted spend"              tone="amber" />
      </div>

      {/* Budget utilization */}
      <Panel title="Budget Utilization" subtitle="Planned vs actual spend per campaign" icon={BarChart3}>
        <div className="space-y-4">
          {utilizationData.map((c, i) => (
            <div key={c.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-brand-ink/70">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {i + 1}
                  </span>
                  {c.name}
                </span>
                <span className="font-mono font-bold text-brand-ink tabular-nums">
                  {formatCurrency(c.used)} <span className="text-brand-ink/40">/ {formatCurrency(c.budget)}</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-brand-lilac">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${c.over ? 'bg-gradient-to-r from-rose-500 to-brand-magenta' : 'bg-gradient-to-r from-brand-magenta to-brand-purple'}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <p className={`mt-1 flex items-center gap-1 font-mono text-[10px] ${c.over || c.budget === 0 ? 'text-rose-500' : c.used === 0 ? 'text-brand-ink/50' : 'text-emerald-600'}`}>
                {c.over || c.budget === 0 ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                {c.status}
                {c.budget > 0 && ` · ${formatPercent(c.actualPct)} utilized`}
                {c.over && ` · ${formatCurrency(c.overBy)} over budget`}
                {!c.over && c.budget > 0 && c.remaining > 0 && ` · ${formatCurrency(c.remaining)} remaining`}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Snapshot tiles */}
      <Panel title="Budget Snapshot" subtitle="Key spend figures at a glance" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <MetricTile icon={Wallet}       label="Campaign Budget" value={formatCurrency(metrics.budget)}      color="purple" />
          <MetricTile icon={PiggyBank}    label="Planned Spend"   value={formatCurrency(metrics.plannedSpend)} color="amber" />
          <MetricTile icon={Receipt}      label="Actual Spend"    value={formatCurrency(metrics.actualSpend)}  color="rose" />
          <MetricTile icon={Clock}        label="Daily Spend"     value={formatCurrency(metrics.dailySpend)}   color="purple" />
          <MetricTile icon={Percent}      label="Utilization"     value={formatPercent(metrics.utilization)}   color="emerald" />
          <MetricTile icon={TrendingUp} label="Spend Variance" value={`${metrics.variance > 0 ? '+' : metrics.variance < 0 ? '-' : ''}${formatCurrency(Math.abs(metrics.variance))}`} color={metrics.variance > 0 ? 'rose' : 'emerald'} />
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── CAMPAIGN SPENDING TAB ─────────── */
const SpendTab = memo(function SpendTab({ metrics, spendChartData, chartView, setChartView, scopedCampaigns }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Spend Breakdown"
          subtitle="Planned vs actual per campaign"
          icon={BarChart3}
          action={
            <div className="inline-flex items-center gap-1 rounded-full border border-brand-lilac bg-brand-mist p-1">
              {CHART_VIEWS.map((v) => {
                const active = chartView === v.key;
                return (
                  <button
                    type="button"
                    key={v.key}
                    aria-pressed={active}
                    onClick={() => setChartView(v.key)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-card scale-105'
                        : 'text-brand-ink/60 hover:text-brand-magenta'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          }
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'flow' ? (
                <AreaChart data={spendChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="plannedArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B2FD6" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#8B2FD6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="actualArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31C79" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#E31C79" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toLocaleString('en-IN')}k`} tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E31C79', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="planned" name="Planned" stroke="#8B2FD6" strokeWidth={2} fill="url(#plannedArea)" />
                  <Area type="monotone" dataKey="actual"  name="Actual"  stroke="#E31C79" strokeWidth={3} fill="url(#actualArea)" />
                </AreaChart>
              ) : (
                <BarChart data={spendChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toLocaleString('en-IN')}k`} tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1E4FB', radius: 8 }} />
                  <Bar dataKey="planned" name="Planned" radius={[8, 8, 2, 2]} barSize={20} fill="#8B2FD6" />
                  <Bar dataKey="actual"  name="Actual"  radius={[8, 8, 2, 2]} barSize={20} fill="#E31C79" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Per-Campaign Spend" subtitle={`${scopedCampaigns.length} campaigns`} icon={Receipt}>
          <div className="space-y-3">
            {scopedCampaigns.map((c) => {
              const budget = toSafeNumber(c.budget);
              const actual = toSafeNumber(c.actualSpend);
              const over = actual > budget;
              const pct = budget > 0 ? (actual / budget) * 100 : 0;
              return (
                <div key={c.id} className="rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-display text-sm font-bold text-brand-ink">{c.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${over || budget === 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {budget > 0 ? `${pct.toFixed(1)}%` : 'No budget'}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-display text-sm font-bold text-brand-purple tabular-nums">{formatCurrency(c.budget)}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/40">Budget</p>
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold text-amber-600 tabular-nums">{formatCurrency(c.plannedSpend)}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/40">Planned</p>
                    </div>
                    <div>
                      <p className={`font-display text-sm font-bold tabular-nums ${over ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(c.actualSpend)}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/40">Actual</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="All Spend Metrics" subtitle="Consolidated view" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <MetricTile icon={Wallet}     label="Campaign Budget"  value={formatCurrency(metrics.budget)}        color="purple" />
          <MetricTile icon={PiggyBank}  label="Planned Spend"    value={formatCurrency(metrics.plannedSpend)}  color="amber" />
          <MetricTile icon={Receipt}    label="Actual Spend"     value={formatCurrency(metrics.actualSpend)}   color="rose" />
          <MetricTile icon={Clock}      label="Daily Spend"      value={formatCurrency(metrics.dailySpend)}    color="purple" />
          <MetricTile icon={Percent}    label="Utilization"      value={formatPercent(metrics.utilization)}    color="emerald" />
          <MetricTile icon={TrendingUp} label="Spend Variance" value={`${metrics.variance > 0 ? '+' : metrics.variance < 0 ? '-' : ''}${formatCurrency(Math.abs(metrics.variance))}`} color={metrics.variance > 0 ? 'rose' : 'emerald'} />
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── COST EFFICIENCY TAB ─────────── */
const CostTab = memo(function CostTab({ metrics }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <CostCard icon={DollarSign} label="Cost Per Lead"
          value={formatCurrencyPrecise(metrics.cpl)}
          formula={`${formatCurrency(metrics.actualSpend)} spend · ${metrics.leads.toLocaleString('en-IN')} leads`}
          tone="amber" />
        <CostCard icon={UserCheck} label="Cost Per Valid Lead"
          value={formatCurrencyPrecise(metrics.cpValidLead)}
          formula={`${formatCurrency(metrics.actualSpend)} spend · ${metrics.validLeads.toLocaleString('en-IN')} valid leads`}
          tone="emerald" />
        <CostCard icon={Target} label="Cost Per Qualified Lead"
          value={formatCurrencyPrecise(metrics.cpql)}
          formula={`${formatCurrency(metrics.actualSpend)} spend · ${metrics.qualified.toLocaleString('en-IN')} qualified`}
          tone="purple" />
        <CostCard icon={Award} label="Cost Per Conversion"
          value={formatCurrencyPrecise(metrics.cpConv)}
          formula={`${formatCurrency(metrics.actualSpend)} spend · ${metrics.converted.toLocaleString('en-IN')} conversions`}
          tone="emerald" />
      </div>

      <Panel title="Cost Breakdown" subtitle="Spend efficiency across the funnel" icon={Coins}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CostRow label="Total Actual Spend"   value={formatCurrency(metrics.actualSpend)}      tone="purple" />
          <CostRow label="Total Leads"          value={metrics.leads.toLocaleString('en-IN')}     tone="emerald" />
          <CostRow label="Valid Leads"          value={metrics.validLeads.toLocaleString('en-IN')} tone="emerald" />
          <CostRow label="Qualified Leads"      value={metrics.qualified.toLocaleString('en-IN')} tone="amber" />
          <CostRow label="Converted Leads"      value={metrics.converted.toLocaleString('en-IN')} tone="emerald" />
          <CostRow label="Revenue Generated"    value={formatCurrency(metrics.revenue)}           tone="rose" />
          <CostRow label="Marketing Contribution" value={formatCurrency(metrics.profit)}          tone={metrics.profit >= 0 ? 'emerald' : 'rose'} />
        </div>
      </Panel>

      <Panel title="Cost Efficiency Summary" subtitle="Spend per funnel stage" icon={Target}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CostRow label="Cost Per Lead"           value={formatCurrencyPrecise(metrics.cpl)}        tone="amber" />
          <CostRow label="Cost Per Valid Lead"      value={formatCurrencyPrecise(metrics.cpValidLead)} tone="emerald" />
          <CostRow label="Cost Per Qualified Lead" value={formatCurrencyPrecise(metrics.cpql)}       tone="purple" />
          <CostRow label="Cost Per Conversion"     value={formatCurrencyPrecise(metrics.cpConv)}     tone="emerald" />
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── DAILY SPEND TAB ─────────── */
const DailyTab = memo(function DailyTab({ metrics, dailySpendTrend }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard icon={Clock}      label="Daily Spend"    value={formatCurrency(metrics.dailySpend)}          sub="Current daily run-rate" color="purple" />
        <MetricCard icon={Calendar} label="30-Day Projection" value={formatCurrency(metrics.dailySpend * 30)} sub="Based on current daily spend" color="amber" />
        <MetricCard icon={TrendingUp} label="Budget Runway" value={metrics.runway === null ? 'N/A' : `${metrics.runway} days`} sub="At current rate" color="emerald" />
      </div>

      <Panel title="Daily Spend Run-rate Projection" subtitle="15-day projection based on the current daily spending rate · Not historical data" icon={Activity}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySpendTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E31C79" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#E31C79" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: 'Projection Days', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#8b7a9e' }} tick={{ fontSize: 10, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toLocaleString('en-IN')}k`} tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E31C79', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="amount" name="Projected Spend / Day" stroke="#E31C79" strokeWidth={3} fill="url(#dailyArea)"
                dot={{ r: 3, fill: '#E31C79' }} activeDot={{ r: 6, fill: '#E31C79', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Daily Spend Metrics" subtitle="Consolidated daily figures" icon={Receipt}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <MetricTile icon={Clock}        label="Daily Spend"   value={formatCurrency(metrics.dailySpend)}       color="purple" />
          <MetricTile icon={Calendar}     label="Monthly Est."  value={formatCurrency(metrics.dailySpend * 30)} color="amber" />
          <MetricTile icon={TrendingUp} label="Runway" value={metrics.runway === null ? 'N/A' : `${metrics.runway} d`} color="emerald" />
          <MetricTile icon={Receipt}      label="Actual Spend"  value={formatCurrency(metrics.actualSpend)}     color="rose" />
          <MetricTile icon={Wallet}       label="Campaign Budget" value={formatCurrency(metrics.budget)}         color="purple" />
          <MetricTile icon={TrendingDown} label="Spend Variance" value={`${metrics.variance > 0 ? '+' : metrics.variance < 0 ? '-' : ''}${formatCurrency(Math.abs(metrics.variance))}`} color={metrics.variance > 0 ? 'rose' : 'emerald'} />
        </div>
      </Panel>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   LEAF COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, sub, color = 'purple', delay = 0 }) {
  const showValue = value;
  const t = KPI_THEMES[color] || KPI_THEMES.purple;

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/30 p-4 text-left shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 hover:-translate-y-1.5 animate-fade-slide-in ${t.border} ${t.shadow}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100`} />
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
      <span className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${t.glow} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.iconBg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
          <Icon size={18} />
        </span>
      </div>

      <div className="relative z-10 w-full">
        <p className={`truncate font-display text-2xl font-bold leading-tight tabular-nums ${t.valueColor}`}>{showValue}</p>
        <p className="mt-0.5 text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </div>
  );
});

// function useAnimatedCount(target, duration = 600) {
//   const [display, setDisplay] = useState(0);
//   const startRef = useRef(null);
//   const rafRef = useRef(null);

//   useEffect(() => {
//     const to = Number(target) || 0;
//     if (to <= 0) { setDisplay(0); return undefined; }

//     startRef.current = null;
//     const tick = (now) => {
//       if (startRef.current === null) startRef.current = now;
//       const elapsed = now - startRef.current;
//       const progress = Math.min(elapsed / duration, 1);
//       const eased = 1 - Math.pow(1 - progress, 3);
//       setDisplay(Math.round(to * eased));
//       if (progress < 1) rafRef.current = requestAnimationFrame(tick);
//     };
//     rafRef.current = requestAnimationFrame(tick);
//     return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
//   }, [target, duration]);

//   return display.toLocaleString('en-IN');
// }

const Panel = memo(function Panel({ title, subtitle, action, icon: Icon, className = '', children }) {
  return (
    <div className={`group/panel relative overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/40 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)] transition-all duration-300 hover:border-brand-magenta/35 hover:shadow-[0_14px_36px_-16px_rgba(227,28,121,0.28)] ${className}`}>
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-magenta/40 to-transparent opacity-70 transition-opacity duration-500 group-hover/panel:opacity-100" />
      <div className="flex items-start justify-between gap-3 border-b border-brand-lilac/70 bg-gradient-to-r from-brand-mist/60 to-transparent px-5 py-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-[0_4px_12px_-4px_rgba(227,28,121,0.5)] transition-transform group-hover/panel:scale-110 group-hover/panel:rotate-3">
              <Icon size={15} />
            </span>
          )}
          <div>
            <h2 className="font-display text-[15px] font-bold leading-tight text-brand-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] font-medium text-brand-ink/60">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
});

const MetricTile = memo(function MetricTile({ icon: Icon, label, value, color = 'purple' }) {
  return (
    <div className={`group rounded-xl border ${METRIC_TILE_COLORS[color]} p-3 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-wider opacity-70">{label}</p>
        <Icon size={12} className="transition-transform group-hover:scale-110" />
      </div>
      <p className="mt-1 truncate font-display text-lg font-bold tabular-nums">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
});

const MetricCard = memo(function MetricCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white to-brand-mist/40 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-magenta/40 hover:shadow-md">
      {Icon && (
        <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-mist ${METRIC_CARD_COLORS[color]}`}>
          <Icon size={16} />
        </span>
      )}
      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${METRIC_CARD_COLORS[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-brand-ink/60">{sub}</p>}
    </div>
  );
});

const CostCard = memo(function CostCard({ icon: Icon, label, value, formula, tone = 'purple' }) {
  const t = COST_CARD_TONES[tone] || COST_CARD_TONES.purple;
  return (
    <div className={`group relative overflow-hidden rounded-2xl border-2 ${t.border} bg-gradient-to-br from-white to-brand-mist/30 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${t.fg}`}>{value}</p>
      <p className="mt-1 break-words font-mono text-[10px] leading-relaxed text-brand-ink/50">{formula}</p>
    </div>
  );
});

const CostRow = memo(function CostRow({ label, value, tone = 'purple' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 px-4 py-3">
      <span className="text-sm text-brand-ink/70">{label}</span>
      <span className={`font-display text-base font-bold tabular-nums ${COST_ROW_TONES[tone]}`}>{value}</span>
    </div>
  );
});

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-brand-magenta/30 bg-white px-3 py-2 shadow-[0_8px_24px_-8px_rgba(227,28,121,0.4)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-magenta">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-display text-sm font-bold text-brand-ink">
          {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          {p.name && <span className="ml-1 text-xs font-normal text-brand-ink/60">{p.name}</span>}
        </p>
      ))}
    </div>
  );
});

const EmptyState = memo(function EmptyState({ message }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lilac text-brand-magenta">
        <Inbox size={22} />
      </span>
      <p className="font-display text-base font-semibold text-brand-ink">
        {message || 'No budget data yet'}
      </p>
      <p className="max-w-sm text-sm text-brand-ink/50">
        Add marketing campaigns with budget, spending, lead and conversion details to monitor cost efficiency here.
      </p>
    </div>
  );
});

const Toast = memo(function Toast({ message, type }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-panel ${
        type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'
      }`}>
        {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        {message}
      </div>
    </div>
  );
});
