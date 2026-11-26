// src/pages/marketing/MarketingFunnel.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, Users, Sparkles,
  Target, TrendingUp, Layers, Inbox, ArrowRight, Megaphone,
  Percent, Award, MessageSquare, Filter, UserCheck, Send, Phone,
  Handshake, ShieldCheck, Briefcase, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, Cell, AreaChart, Area,
} from 'recharts';


/* ═══════════════════════════════════════════════════════════════
   MODULE-LEVEL CONSTANTS
   ═══════════════════════════════════════════════════════════════ */


const STORAGE_KEY = 'funnel:marketing';

const TABS = [
  { key: 'flow',      label: 'Funnel Flow',      icon: Filter },
  { key: 'stages',    label: 'Stage Breakdown',  icon: Layers },
  { key: 'dropoff',   label: 'Drop-off Analysis', icon: TrendingUp },
  { key: 'handover',  label: 'Handover & Conversion', icon: Handshake },
];

const CHART_VIEWS = [
  { key: 'bars', label: 'Bars' },
  { key: 'flow', label: 'Area' },
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

/* ─── 11-stage funnel definition ─── */
const FUNNEL_STAGES = [
  { key: 'generated',    label: 'Lead Generated',       icon: Sparkles,      color: '#E31C79', group: 'lead' },
  { key: 'captured',    label: 'Lead Captured',        icon: Inbox,          color: '#EC4899', group: 'lead' },
  { key: 'validation',  label: 'Lead Validation',      icon: ShieldCheck,   color: '#F472B6', group: 'lead' },
  { key: 'qualification', label: 'Lead Qualification', icon: Target,        color: '#F59E0B', group: 'lead' },
  { key: 'handover',    label: 'Lead Handover',        icon: Send,           color: '#FB923C', group: 'handover' },
  { key: 'manager',     label: 'Lead Manager Received', icon: Briefcase,     color: '#FBBF24', group: 'handover' },
  { key: 'agent',       label: 'Agent Assigned',        icon: UserCheck,     color: '#10B981', group: 'handover' },
  { key: 'call',        label: 'Call / Communication',  icon: Phone,         color: '#14B8A6', group: 'post' },
  { key: 'followup',   label: 'Follow-up',             icon: MessageSquare, color: '#06B6D4', group: 'post' },
  { key: 'qualified',  label: 'Final Qualified',       icon: CheckCircle,   color: '#0EA5E9', group: 'post' },
  { key: 'conversion', label: 'Conversion',            icon: Award,         color: '#8B5CF6', group: 'post' },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const toSafeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const normalizeCampaign = (campaign) => {
  if (
    !campaign ||
    typeof campaign !== 'object' ||
    Array.isArray(campaign) ||
    !campaign.id ||
    typeof campaign.name !== 'string' ||
    !campaign.name.trim()
  ) {
    return null;
  }

  return {
    ...campaign,
    id: String(campaign.id),
    name: campaign.name.trim(),
    project: typeof campaign.project === 'string' ? campaign.project : '',
    type: typeof campaign.type === 'string' ? campaign.type : '',
    channel: typeof campaign.channel === 'string' ? campaign.channel : '',
    audience: toSafeNumber(campaign.audience),
    campaigns: toSafeNumber(campaign.campaigns),
    ads: toSafeNumber(campaign.ads),
    leads: toSafeNumber(campaign.leads),
    captured: toSafeNumber(campaign.captured),
    validated: toSafeNumber(campaign.validated),
    qualified: toSafeNumber(campaign.qualified),
    handover: toSafeNumber(campaign.handover),
    managerReceived: toSafeNumber(campaign.managerReceived),
    assigned: toSafeNumber(campaign.assigned),
    contacted: toSafeNumber(campaign.contacted),
    followUps: toSafeNumber(campaign.followUps),
    finalQualified: toSafeNumber(campaign.finalQualified),
    converted: toSafeNumber(campaign.converted),
  };
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

    const uniqueCampaigns = normalized.filter(
      (campaign, index, array) =>
        array.findIndex((item) => item.id === campaign.id) === index
    );

    return uniqueCampaigns;
  } catch (error) {
    console.error('Failed to load funnel data:', error);
    return fallback;
  }
};

const saveState = (value) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* ignore */ }
};

const formatNumber = (n) => {
  const value = Number(n);
  return (Number.isFinite(value) ? value : 0).toLocaleString('en-IN');
};
const formatPercent = (n) => {
  const value = Number(n);
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
};

const toPercent = (a, b) => {
  const numerator = Number(a) || 0;
  const denominator = Number(b) || 0;

  return denominator > 0
    ? (numerator / denominator) * 100
    : 0;
};

const formatRatio = (a, b) => toPercent(a, b);

/* ═══════════════════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════════════════ */
const SEED_CAMPAIGNS = [
  {
    id: 'cmp-1', name: 'Summer Sale Campaign', type: 'Promotion', channel: 'Google Ads', project: 'Eliteinova Matrimony',
    audience: 150000, campaigns: 4, ads: 12, leads: 1000, captured: 850, validated: 780,
    qualified: 420, handover: 380, managerReceived: 360, assigned: 340, contacted: 300,
    followUps: 240, finalQualified: 180, converted: 90,
  },
  {
    id: 'cmp-2', name: 'Google Search - CRM', type: 'Lead Generation', channel: 'Google Ads', project: 'Eliteinova CRM',
    audience: 220000, campaigns: 6, ads: 18, leads: 1400, captured: 1280, validated: 1150,
    qualified: 680, handover: 620, managerReceived: 590, assigned: 560, contacted: 500,
    followUps: 400, finalQualified: 290, converted: 140,
  },
  {
    id: 'cmp-3', name: 'Facebook Awareness', type: 'Brand Awareness', channel: 'Facebook', project: 'Eliteinova Matrimony',
    audience: 90000, campaigns: 3, ads: 8, leads: 500, captured: 420, validated: 360,
    qualified: 180, handover: 160, managerReceived: 150, assigned: 140, contacted: 120,
    followUps: 90, finalQualified: 65, converted: 30,
  },
  {
    id: 'cmp-4', name: 'Product Launch Q3', type: 'Product Launch', channel: 'LinkedIn', project: 'Eliteinova CRM',
    audience: 300000, campaigns: 8, ads: 24, leads: 2000, captured: 1850, validated: 1700,
    qualified: 1000, handover: 920, managerReceived: 880, assigned: 840, contacted: 760,
    followUps: 620, finalQualified: 450, converted: 220,
  },
  {
    id: 'cmp-5', name: 'Diwali Festival Promo', type: 'Festival Campaign', channel: 'Meta Ads', project: 'Eliteinova Matrimony',
    audience: 180000, campaigns: 5, ads: 15, leads: 1200, captured: 1080, validated: 980,
    qualified: 540, handover: 490, managerReceived: 470, assigned: 450, contacted: 400,
    followUps: 320, finalQualified: 220, converted: 110,
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingFunnel() {
  

  const [campaigns, setCampaigns] = useState(() => loadState(SEED_CAMPAIGNS));
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedCampaignId, setSelectedCampaignId] = useState('all');
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [chartView, setChartView] = useState('bars');
  
  const hydratedRef = useRef(false);
useEffect(() => {
  if (!hydratedRef.current) { hydratedRef.current = true; return; }
  saveState(campaigns);
}, [campaigns]);

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

  /* Aggregate totals across all campaign funnel metrics */
  const totals = useMemo(() => {
    return scopedCampaigns.reduce(
      (acc, c) => {
        acc.audience += toSafeNumber(c.audience);
        acc.campaigns += toSafeNumber(c.campaigns);
        acc.ads += toSafeNumber(c.ads);
        acc.leads += toSafeNumber(c.leads);
        acc.captured += toSafeNumber(c.captured);
        acc.validated += toSafeNumber(c.validated);
        acc.qualified += toSafeNumber(c.qualified);
        acc.handover += toSafeNumber(c.handover);
        acc.managerReceived += toSafeNumber(c.managerReceived);
        acc.assigned += toSafeNumber(c.assigned);
        acc.contacted += toSafeNumber(c.contacted);
        acc.followUps += toSafeNumber(c.followUps);
        acc.finalQualified += toSafeNumber(c.finalQualified);
        acc.converted += toSafeNumber(c.converted);
        return acc;
      },
      {
        audience: 0, campaigns: 0, ads: 0, leads: 0, captured: 0,
        validated: 0, qualified: 0, handover: 0, managerReceived: 0,
        assigned: 0, contacted: 0, followUps: 0, finalQualified: 0, converted: 0,
      }
    );
  }, [scopedCampaigns]);

  /* Map stage keys -> aggregated values */
  const stageValues = useMemo(() => ({
    audience: totals.audience,
    campaign: totals.campaigns,
    ad: totals.ads,
    generated: totals.leads,
    captured: totals.captured,
    validation: totals.validated,
    qualification: totals.qualified,
    handover: totals.handover,
    manager: totals.managerReceived,
    agent: totals.assigned,
    call: totals.contacted,
    followup: totals.followUps,
    qualified: totals.finalQualified,
    conversion: totals.converted,
  }), [totals]);

  const funnelData = useMemo(() => {
    const top = stageValues.generated || 0;

    return FUNNEL_STAGES.map((stage) => {
        const value = stageValues[stage.key] || 0;

        return {
        ...stage,
        value,
        pctOfTop: top > 0
            ? (value / top) * 100
            : 0,
        };
    });
    }, [stageValues]);

  /* Stage-to-stage drop-off */
  const dropoffData = useMemo(() => {
    return FUNNEL_STAGES.map((stage, index) => {
        const value = stageValues[stage.key] || 0;

        const previousStage = index === 0
        ? stage
        : FUNNEL_STAGES[index - 1];

        const prev = index === 0
        ? value
        : stageValues[previousStage.key] || 0;

        const drop = Math.max(0, prev - value);
        const increase = Math.max(0, value - prev);

        const dropPct = prev > 0
            ? (drop / prev) * 100
            : 0;

        const increasePct = prev > 0
            ? (increase / prev) * 100
            : 0;

        return {
        ...stage,
        value,
        prev,
        prevStageLabel: previousStage.label,
        drop,
        dropPct,
        increase,
        increasePct,
        isFirst: index === 0,
        hasIncrease: value > prev,
        };
    });
    }, [stageValues]);

  /* Chart data for bars */
  const chartData = useMemo(() =>
    FUNNEL_STAGES.map((s) => ({
      name: s.label,
      value: stageValues[s.key] || 0,
      color: s.color,
    })),
  [stageValues]);

  const kpis = useMemo(() => ([
    { icon: Users,       label: 'Audience Reach',     value: totals.audience,  sub: `${formatNumber(totals.campaigns)} campaigns combined`,      color: 'purple',  delay: 0   },
    { icon: Sparkles,    label: 'Leads Generated',    value: totals.leads,      sub: `${formatNumber(totals.captured)} captured`,        color: 'rose',    delay: 40  },
    { icon: ShieldCheck, label: 'Validated Leads',    value: totals.validated,  sub: `${formatPercent(formatRatio(totals.validated, totals.leads))} of leads`, color: 'amber', delay: 80 },
    { icon: Handshake,   label: 'Handed Over',        value: totals.handover,   sub: `${formatPercent(formatRatio(totals.handover, totals.validated))} of validated`, color: 'purple', delay: 120 },
    { icon: Award,       label: 'Conversions',        value: totals.converted,  sub: `${formatPercent(formatRatio(totals.converted, totals.leads))} of generated leads`, color: 'emerald', delay: 160 },
  ]), [totals]);

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
            <h1 className="font-display text-xl font-semibold text-brand-ink">Marketing Funnel</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <Filter size={13} className="text-brand-magenta" />
              Track the complete marketing journey from audience to conversion
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
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Funnel Overview</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">
                {selectedCampaign ? selectedCampaign.name : `${formatNumber(totals.campaigns)} campaigns combined`}
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
          <EmptyState message="No campaigns match this selection" />
        ) : (
          <>
            {activeTab === 'flow'     && <FlowTab     funnelData={funnelData} chartData={chartData} chartView={chartView} setChartView={setChartView} />}
            {activeTab === 'stages'   && <StagesTab   funnelData={funnelData} />}
            {activeTab === 'dropoff'  && <DropoffTab  dropoffData={dropoffData} />}
            {activeTab === 'handover' && <HandoverTab totals={totals} />}
          </>
        )}

        
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
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-lilac/40"
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
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full z-30 mt-2 max-h-72 w-64 overflow-y-auto no-scrollbar rounded-xl border border-brand-lilac bg-white p-1 shadow-panel">
            <button
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

/* ─────────── FUNNEL FLOW TAB ─────────── */
const FlowTab = memo(function FlowTab({ funnelData, chartData, chartView, setChartView }) {
  return (
    <div className="space-y-5">
      <Panel
        title="Complete Marketing Journey"
        subtitle="Lead Generated → Qualification → Handover → Conversion"
        icon={Filter}
        action={
          <div className="inline-flex items-center gap-1 rounded-full border border-brand-lilac bg-brand-mist p-1">
            {CHART_VIEWS.map((v) => {
              const active = chartView === v.key;
              return (
                <button
                  key={v.key}
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
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'flow' ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="funnelFlowArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E31C79" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#E31C79" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} interval={0} angle={-40} textAnchor="end" height={90} />
                <YAxis tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E31C79', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="value" name="Count" stroke="#E31C79" strokeWidth={3} fill="url(#funnelFlowArea)"
                  dot={{ r: 4, fill: '#E31C79' }} activeDot={{ r: 6, fill: '#E31C79', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} interval={0} angle={-40} textAnchor="end" height={90} />
                <YAxis tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1E4FB', radius: 8 }} />
                <Bar dataKey="value" name="Count" radius={[8, 8, 2, 2]} barSize={26}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── STAGE BREAKDOWN TAB ─────────── */
const StagesTab = memo(function StagesTab({ funnelData }) {
  return (
    <div className="space-y-5">
      <Panel title="Stage Breakdown" subtitle="Count and percentage of generated leads" icon={Layers}>
        <div className="space-y-3">
          {funnelData.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ background: s.color }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-brand-ink">{s.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                       {formatPercent(s.pctOfTop)} of generated leads
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div>
                      <p className="font-display text-lg font-bold tabular-nums" style={{ color: s.color }}>
                        {formatNumber(s.value)}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/40">count</p>
                    </div>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `${s.color}22`, color: s.color }}
                    >
                      <Icon size={16} />
                    </span>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-lilac">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${Math.min(s.pctOfTop, 100)}%`,
                        background: s.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── DROP-OFF ANALYSIS TAB ─────────── */
const DropoffTab = memo(function DropoffTab({ dropoffData }) {
  const worst = useMemo(
    () =>
        [...dropoffData]
        .filter((d) => !d.isFirst && d.drop > 0)
        .sort((a, b) => b.dropPct - a.dropPct)
        .slice(0, 3),
    [dropoffData]
 );

  return (
    <div className="space-y-5">
      {/* Worst drop-offs */}
<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
  {worst.length > 0 ? (
    worst.map((d, i) => (
      <div
        key={d.key}
        className={`group relative overflow-hidden rounded-2xl border-2 ${
          COST_CARD_TONES[i === 0 ? 'rose' : i === 1 ? 'amber' : 'purple'].border
        } bg-gradient-to-br from-white to-brand-mist/30 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            COST_CARD_TONES[i === 0 ? 'rose' : i === 1 ? 'amber' : 'purple'].bg
          } ${
            COST_CARD_TONES[i === 0 ? 'rose' : i === 1 ? 'amber' : 'purple'].fg
          }`}
        >
          <TrendingUp size={18} />
        </span>

        <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
          Biggest Drop-off #{i + 1}
        </p>

        <p
          className={`mt-1 font-display text-2xl font-bold ${
            COST_CARD_TONES[i === 0 ? 'rose' : i === 1 ? 'amber' : 'purple'].fg
          }`}
        >
          {d.dropPct.toFixed(1)}%
        </p>

        <p className="mt-1 text-sm font-semibold text-brand-ink">
          {d.prevStageLabel} → {d.label}
        </p>

        <p className="mt-0.5 font-mono text-[10px] text-brand-ink/50">
          {formatNumber(d.prev)} → {formatNumber(d.value)} ({formatNumber(d.drop)} lost)
        </p>
      </div>
    ))
  ) : (
    <div className="md:col-span-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

      <p className="mt-2 font-semibold text-emerald-700">
        No drop-offs detected
      </p>

      <p className="mt-1 text-sm text-emerald-600/80">
        There are no stage losses in the current campaign selection.
      </p>
    </div>
  )}
</div>

      <Panel title="Stage-to-Stage Drop-off" subtitle="Loss between consecutive stages" icon={TrendingUp}>
        <div className="space-y-3">
          {dropoffData.filter((d) => !d.isFirst).map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.key} className="rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ background: d.color }}
                    >
                      <Icon size={12} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-ink">{d.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                        From previous stage
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right">
                    <div>
                      <p className="font-mono text-[10px] text-brand-ink/40">prev</p>
                      <p className="font-display text-sm font-bold tabular-nums text-brand-ink">{formatNumber(d.prev)}</p>
                    </div>
                    <ArrowRight size={12} className="text-brand-magenta/50" />
                    <div>
                      <p className="font-mono text-[10px] text-brand-ink/40">now</p>
                      <p className="font-display text-sm font-bold tabular-nums text-brand-ink">{formatNumber(d.value)}</p>
                    </div>
                    <div
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                            d.hasIncrease
                            ? 'bg-violet-100 text-violet-600'
                            : d.dropPct > 40
                                ? 'bg-rose-100 text-rose-600'
                                : d.dropPct > 20
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-emerald-100 text-emerald-600'
                        }`}
                        >
                        {d.hasIncrease
                            ? `+${d.increasePct.toFixed(1)}% increase`
                            : d.drop > 0
                            ? `-${d.dropPct.toFixed(1)}%`
                            : '0% loss'}
                        </div>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-lilac">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${d.dropPct > 40 ? 'bg-gradient-to-r from-rose-500 to-brand-magenta' : d.dropPct > 20 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                    style={{
                        width: `${Math.min(d.dropPct, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── HANDOVER & CONVERSION TAB ─────────── */
const HandoverTab = memo(function HandoverTab({ totals }) {
  const handoverStages = useMemo(() => [
    { key: 'handover',        label: 'Lead Handover',        value: totals.handover,        color: '#FB923C', icon: Send,        pct: formatRatio(totals.handover, totals.qualified) },
    { key: 'managerReceived', label: 'Lead Manager Received', value: totals.managerReceived, color: '#FBBF24', icon: Briefcase,   pct: formatRatio(totals.managerReceived, totals.handover) },
    { key: 'agent',           label: 'Agent Assigned',        value: totals.assigned,        color: '#10B981', icon: UserCheck,   pct: formatRatio(totals.assigned, totals.managerReceived) },
    { key: 'call',            label: 'Call / Communication',  value: totals.contacted,       color: '#14B8A6', icon: Phone,       pct: formatRatio(totals.contacted, totals.assigned) },
    { key: 'followup',        label: 'Follow-up',             value: totals.followUps,       color: '#06B6D4', icon: MessageSquare, pct: formatRatio(totals.followUps, totals.contacted) },
    { key: 'qualified',       label: 'Final Qualified',       value: totals.finalQualified,  color: '#0EA5E9', icon: CheckCircle, pct: formatRatio(totals.finalQualified, totals.followUps) },
    { key: 'conversion',      label: 'Conversion',            value: totals.converted,       color: '#8B5CF6', icon: Award,       pct: formatRatio(totals.converted, totals.finalQualified) },
  ], [totals]);

  return (
    <div className="space-y-5">
      <Panel title="Handover Pipeline" subtitle="From handover to conversion" icon={Handshake}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {handoverStages.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: s.color }}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-ink">{s.label}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                        {s.pct.toFixed(1)}% of previous
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-lg font-bold tabular-nums" style={{ color: s.color }}>
                    {formatNumber(s.value)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-lilac">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(s.pct, 100)}%`, background: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Conversion Metrics" subtitle="End-to-end performance" icon={Award}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard icon={Users}   label="Total Leads"       value={formatNumber(totals.leads)}      sub={`${formatNumber(totals.captured)} captured`} color="purple" />
          <MetricCard icon={Award}   label="Conversions"       value={formatNumber(totals.converted)}  sub={`${formatPercent(formatRatio(totals.converted, totals.leads))} conversion rate`} color="emerald" />
          <MetricCard icon={Percent} label="Handover Rate"     value={formatPercent(formatRatio(totals.handover, totals.validated))} sub="Validated → handover" color="amber" />
        </div>
      </Panel>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   LEAF COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, sub, color = 'purple', delay = 0 }) {
  const numeric = typeof value === 'number';
  const displayValue = useAnimatedCount(numeric ? value : 0);
  const showValue = numeric ? displayValue : value;
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

function useAnimatedCount(target, duration = 600) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const to = Number(target) || 0;
    if (to <= 0) { setDisplay(0); return undefined; }

    startRef.current = null;
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(to * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display.toLocaleString('en-IN');
}

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

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-brand-magenta/30 bg-white px-3 py-2 shadow-[0_8px_24px_-8px_rgba(227,28,121,0.4)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-magenta">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-display text-sm font-bold text-brand-ink">
          {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
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
        {message || 'No funnel data yet'}
      </p>
      <p className="max-w-sm text-sm text-brand-ink/50">
        Create campaigns with audience and lead activity to see the funnel here.
      </p>
    </div>
  );
});

