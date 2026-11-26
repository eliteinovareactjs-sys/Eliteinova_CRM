// src/pages/marketing/LeadQualityManagement.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, AlertCircle, CheckCircle2, Users, Sparkles,
  Target, Layers, Flame, Inbox, Activity, Megaphone,
  BarChart3, Percent, Award, MessageSquare, UserCheck, ShieldCheck,
  Copy, ThumbsUp, ThumbsDown, PhoneCall, MessageCircle,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, Cell, AreaChart, Area, PieChart, Pie,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   MODULE-LEVEL CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'leadQuality:marketing';

const TABS = [
  { key: 'overview',   label: 'Quality Overview',   icon: ShieldCheck },
  { key: 'indicators', label: 'Quality Indicators', icon: Layers },
  { key: 'duplicates', label: 'Duplicates',         icon: Copy },
  { key: 'feedback',   label: 'Agent Feedback',     icon: MessageCircle },
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

const BAR_TONES = {
  purple:  'bg-brand-purple',
  emerald: 'bg-emerald-500',
  rose:    'bg-brand-magenta',
  amber:   'bg-amber-500',
};

const FEEDBACK_GUIDELINES = [
  { title: 'Highly Interested', description: 'Customer actively wants the product or service.',  color: 'emerald', icon: CheckCircle2 },
  { title: 'Interested',        description: 'Customer has shown interest and needs follow-up.', color: 'purple',  icon: ThumbsUp },
  { title: 'Not Interested',    description: 'Customer has declined the offer.',                 color: 'rose',    icon: ThumbsDown },
  { title: 'Invalid Enquiry',   description: 'Contact information or enquiry is incorrect.',     color: 'amber',   icon: AlertCircle },
  { title: 'Wrong Audience',    description: 'Lead does not match the intended target audience.', color: 'rose',   icon: Users },
  { title: 'Needs Follow-Up',   description: 'Customer requires another call or clarification.', color: 'purple',  icon: PhoneCall },
];

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
    ? Math.round(number)
    : 0;
};

const clampCount = (value, max) => {
  return Math.min(
    Math.max(0, Math.round(toSafeNumber(value))),
    max
  );
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

  const leads = toSafeNumber(campaign.leads);

  const valid = clampCount(campaign.valid, leads);
  const interested = clampCount(campaign.interested, valid);
  const targetMatch = clampCount(campaign.targetMatch, valid);
  const qualified = clampCount(
    campaign.qualified,
    Math.min(valid, targetMatch)
  );

  const agentPositive = clampCount(
    campaign.agentPositive,
    qualified
  );

  const duplicates = clampCount(campaign.duplicates, leads);

  const converted = clampCount(
    campaign.converted,
    agentPositive
  );

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

    leads,
    valid,
    interested,
    targetMatch,
    qualified,
    duplicates,
    agentPositive,
    converted,
  };
};

const getUniqueCampaigns = (campaigns) => {
  const campaignMap = new Map();

  campaigns.forEach((campaign) => {
    if (!campaign || !campaign.id) return;

    // Keep the latest record for a duplicate campaign ID.
    campaignMap.set(campaign.id, campaign);
  });

  return Array.from(campaignMap.values());
};

const loadState = (fallback) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return getUniqueCampaigns(parsed.map(normalizeCampaign).filter(Boolean));
  } catch (error) {
    console.error('Failed to load lead quality data:', error);
    return fallback;
  }
};

const saveState = (value) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* ignore */ }
};

const formatNumber = (n) => (Number(n) || 0).toLocaleString('en-IN');

const formatPercent = (n) => {
  const value = Number(n);
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
};

const ratio = (a, b) => {
  const numerator = Number(a);
  const denominator = Number(b);

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    numerator < 0 ||
    denominator <= 0
  ) {
    return 0;
  }

  return (numerator / denominator) * 100;
};

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/* ═══════════════════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════════════════ */
const SEED_CAMPAIGNS = [
  {
    id: 'cmp-1', name: 'Summer Sale 2024', type: 'Promotion', channel: 'Google Ads', project: 'Eliteinova Matrimony',
    leads: 1000, valid: 850, interested: 600, targetMatch: 550, qualified: 420, duplicates: 45, agentPositive: 380, converted: 90,
  },
  {
    id: 'cmp-2', name: 'Google Search - CRM', type: 'Lead Generation', channel: 'Google Ads', project: 'Eliteinova CRM',
    leads: 1400, valid: 1280, interested: 950, targetMatch: 880, qualified: 680, duplicates: 60, agentPositive: 620, converted: 140,
  },
  {
    id: 'cmp-3', name: 'Facebook Awareness', type: 'Brand Awareness', channel: 'Facebook', project: 'Eliteinova Matrimony',
    leads: 500, valid: 420, interested: 240, targetMatch: 200, qualified: 180, duplicates: 35, agentPositive: 150, converted: 30,
  },
  {
    id: 'cmp-4', name: 'Product Launch Q3', type: 'Product Launch', channel: 'LinkedIn', project: 'Eliteinova CRM',
    leads: 2000, valid: 1850, interested: 1400, targetMatch: 1300, qualified: 1000, duplicates: 80, agentPositive: 900, converted: 220,
  },
  {
    id: 'cmp-5', name: 'Diwali Festival Promo', type: 'Festival Campaign', channel: 'Meta Ads', project: 'Eliteinova Matrimony',
    leads: 1200, valid: 1080, interested: 720, targetMatch: 650, qualified: 540, duplicates: 50, agentPositive: 480, converted: 110,
  },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LeadQualityManagement() {
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
        // Ignore unrelated localStorage changes.
        if (event.key !== STORAGE_KEY && event.key !== null) {
        return;
        }

        // Handle localStorage.clear().
        if (event.key === null || event.newValue === null) {
        skipNextPersistRef.current = true;
        setCampaigns([...SEED_CAMPAIGNS]);
        setSelectedCampaignId('all');
        return;
        }

        try {
        const parsed = JSON.parse(event.newValue);

        if (!Array.isArray(parsed)) {
            return;
        }

        const normalized = parsed
            .map(normalizeCampaign)
            .filter(Boolean);

        const uniqueCampaigns = getUniqueCampaigns(normalized);

        skipNextPersistRef.current = true;
        setCampaigns(uniqueCampaigns);
        } catch (error) {
        console.error(
            'Failed to sync lead quality data:',
            error
        );
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
      (acc, c) => {
        acc.leads += toSafeNumber(c.leads);
        acc.valid += toSafeNumber(c.valid);
        acc.interested += toSafeNumber(c.interested);
        acc.targetMatch += toSafeNumber(c.targetMatch);
        acc.qualified += toSafeNumber(c.qualified);
        acc.duplicates += toSafeNumber(c.duplicates);
        acc.agentPositive += toSafeNumber(c.agentPositive);
        acc.converted += toSafeNumber(c.converted);
        return acc;
      },
      { leads: 0, valid: 0, interested: 0, targetMatch: 0, qualified: 0, duplicates: 0, agentPositive: 0, converted: 0 }
    );

    const validRate = Math.min(100, ratio(totals.valid, totals.leads));
    const interestRate = Math.min(100, ratio(totals.interested, totals.leads));
    const targetMatchRate = Math.min(100, ratio(totals.targetMatch, totals.leads));
    const qualificationRate = Math.min(100, ratio(totals.qualified, totals.leads));
    const conversionRate = Math.min(100, ratio(totals.converted, totals.leads));
    const uniqueLeads = Math.max(0, totals.leads - totals.duplicates);
    const agentNotApproved = Math.max(0, totals.qualified - totals.agentPositive);
    const qualityScore = totals.leads > 0
    ? (
        validRate * 0.30 +
        interestRate * 0.20 +
        targetMatchRate * 0.20 +
        qualificationRate * 0.20 +
        conversionRate * 0.10
        )
    : 0;

    return {
      ...totals,
      qualityScore,
      validRate,
      interestRate,
      targetMatchRate,
      qualificationRate,
      conversionRate,
      duplicateRate: ratio(totals.duplicates, totals.leads),
      uniqueRate: ratio(uniqueLeads, totals.leads),
      agentApprovalRate: Math.min(100, ratio(totals.agentPositive, totals.qualified)),
      uniqueLeads,
      agentNotApproved,
    };
  }, [scopedCampaigns]);

  const chartData = useMemo(() => [
    { name: 'Valid Contact',  value: metrics.valid,         color: '#10B981' },
    { name: 'Interested',     value: metrics.interested,    color: '#8B2FD6' },
    { name: 'Target Match',   value: metrics.targetMatch,   color: '#6366F1' },
    { name: 'Qualified',      value: metrics.qualified,     color: '#F59E0B' },
    { name: 'Agent Approved', value: metrics.agentPositive, color: '#EC4899' },
    { name: 'Converted',      value: metrics.converted,     color: '#E31C79' },
  ], [metrics]);

  const pieData = useMemo(() => {
  const duplicateCount = Math.min(
    metrics.duplicates,
    metrics.leads
  );

  const validUnique = Math.max(0, metrics.valid - duplicateCount);
  const invalid = Math.max(0, metrics.leads - duplicateCount - validUnique);

  return [
    { name: 'Valid Unique Leads', value: validUnique, color: '#10B981' },
    { name: 'Duplicates', value: duplicateCount, color: '#E31C79' },
    { name: 'Invalid Leads', value: invalid, color: '#F59E0B', },
  ];
 }, [metrics]);

  const kpis = useMemo(() => ([
    { icon: Users,        label: 'Total Leads',   value: formatNumber(metrics.leads),      sub: `${formatNumber(metrics.duplicates)} duplicates`,          color: 'purple',  delay: 0 },
    { icon: CheckCircle2, label: 'Valid Leads',   value: formatNumber(metrics.valid),      sub: `${formatPercent(metrics.validRate)} valid rate`,          color: 'emerald', delay: 40 },
    { icon: Flame,        label: 'Interested',    value: formatNumber(metrics.interested), sub: `${formatPercent(metrics.interestRate)} interest rate`,    color: 'rose',    delay: 80 },
    { icon: Target,       label: 'Qualified',     value: formatNumber(metrics.qualified),  sub: `${formatPercent(metrics.qualificationRate)} qualified`,   color: 'amber',   delay: 120 },
    { icon: Award,        label: 'Quality Score', value: `${metrics.qualityScore.toFixed(1)}/100`, sub: 'Composite metric',                                color: 'emerald', delay: 160 },
  ]), [metrics]);

  const hasData = scopedCampaigns.length > 0;

  const handleExport = useCallback(() => {
    if (scopedCampaigns.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    try {
      const header = [
        'Campaign', 'Project', 'Channel', 'Total Leads', 'Valid', 'Interested',
        'Target Match', 'Qualified', 'Duplicates', 'Agent Positive', 'Converted',
      ];
      const rows = scopedCampaigns.map((c) => [
        c.name, c.project, c.channel, c.leads, c.valid, c.interested,
        c.targetMatch, c.qualified, c.duplicates, c.agentPositive, c.converted,
      ]);
      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob(
       [BOM, csv],
     { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'lead-quality-report.csv';
    link.style.display = 'none';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    // Allow the browser to process the download first.
    window.setTimeout(() => {
    URL.revokeObjectURL(url);
    }, 1000);

    showToast('Quality report downloaded');
    } catch (error) {
      console.error('Failed to export report:', error);
      showToast('Failed to export report', 'error');
    }
  }, [scopedCampaigns, showToast]);

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
            <h1 className="font-display text-xl font-semibold text-brand-ink">Lead Quality Management</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <ShieldCheck size={13} className="text-brand-magenta" />
              Monitor whether campaigns are generating useful enquiries
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Quality Snapshot</p>
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
            {activeTab === 'overview'   && <OverviewTab   metrics={metrics} chartData={chartData} chartView={chartView} setChartView={setChartView} />}
            {activeTab === 'indicators' && <IndicatorsTab metrics={metrics} pieData={pieData} />}
            {activeTab === 'duplicates' && <DuplicatesTab metrics={metrics} />}
            {activeTab === 'feedback'   && <FeedbackTab   metrics={metrics} />}
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

/* ─────────── QUALITY OVERVIEW TAB ─────────── */
const OverviewTab = memo(function OverviewTab({ metrics, chartData, chartView, setChartView }) {
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <CostCard icon={Users}        label="Total Leads"   value={formatNumber(metrics.leads)}   formula={`${formatNumber(metrics.uniqueLeads)} unique leads`}            tone="purple" />
        <CostCard icon={ShieldCheck}  label="Qualified"     value={formatNumber(metrics.qualified)} formula={`${formatPercent(metrics.qualificationRate)} of total leads`} tone="amber" />
        <CostCard icon={Award}        label="Converted"     value={formatNumber(metrics.converted)} formula={`${formatPercent(metrics.conversionRate)} conversion rate`}   tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Funnel Quality Performance"
          subtitle="Lead quality indicators across stages"
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
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qualityArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31C79" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#E31C79" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E31C79', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" name="Leads" stroke="#E31C79" strokeWidth={3} fill="url(#qualityArea)" dot={{ r: 4, fill: '#E31C79' }} activeDot={{ r: 6, fill: '#E31C79', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1E4FB', radius: 8 }} />
                  <Bar dataKey="value" name="Leads" radius={[8, 8, 2, 2]} barSize={36}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Quality Score Breakdown" subtitle="Composite lead health" icon={Award}>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-brand-lilac bg-white shadow-inner">
              <div className="text-center">
                <p className="font-display text-4xl font-bold tabular-nums text-brand-magenta">{metrics.qualityScore.toFixed(1)}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">out of 100</p>
              </div>
            </div>
            <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <CostRow label="Valid Rate"     value={formatPercent(metrics.validRate)}         tone="emerald" />
              <CostRow label="Interest Rate"  value={formatPercent(metrics.interestRate)}      tone="rose" />
              <CostRow label="Target Match"   value={formatPercent(metrics.targetMatchRate)}   tone="purple" />
              <CostRow label="Qualified Rate" value={formatPercent(metrics.qualificationRate)} tone="amber" />
              <CostRow label="Agent Approval" value={formatPercent(metrics.agentApprovalRate)} tone="emerald" />
              <CostRow label="Conversion"     value={formatPercent(metrics.conversionRate)}    tone="rose" />
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Quality Metrics Summary" subtitle="Consolidated indicators" icon={Activity}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <MetricTile icon={Users}        label="Total Leads"     value={metrics.leads}                          color="purple" />
          <MetricTile icon={CheckCircle2} label="Valid Contact"   value={metrics.valid}                          color="emerald" />
          <MetricTile icon={Flame}        label="Interested"      value={metrics.interested}                     color="rose" />
          <MetricTile icon={Target}       label="Target Audience" value={metrics.targetMatch}                    color="purple" />
          <MetricTile icon={ShieldCheck}  label="Qualified"       value={metrics.qualified}                      color="amber" />
          <MetricTile icon={Copy}         label="Duplicates"      value={metrics.duplicates}                     color="rose" />
          <MetricTile icon={ThumbsUp}     label="Agent Positive"  value={metrics.agentPositive}                  color="emerald" />
          <MetricTile icon={Award}        label="Converted"       value={metrics.converted}                      color="purple" />
          <MetricTile icon={Percent}      label="Conversion Rate" value={formatPercent(metrics.conversionRate)}  color="rose" />
        </div>
      </Panel>
    </div>
  );
});

/* ─────────── QUALITY INDICATORS TAB ─────────── */
const IndicatorsTab = memo(function IndicatorsTab({ metrics, pieData }) {
  const indicators = [
    { label: 'Valid contact information', value: metrics.valid,         pct: metrics.validRate,          icon: CheckCircle2,  color: 'emerald' },
    { label: 'Customer interest',         value: metrics.interested,    pct: metrics.interestRate,       icon: Flame,         color: 'rose' },
    { label: 'Target audience match',     value: metrics.targetMatch,   pct: metrics.targetMatchRate,    icon: Target,        color: 'amber' },
    { label: 'Qualification status',      value: metrics.qualified,     pct: metrics.qualificationRate,  icon: ShieldCheck,   color: 'emerald' },
    { label: 'Unique leads',              value: metrics.uniqueLeads,   pct: metrics.uniqueRate,         icon: UserCheck,     color: 'purple' },
    { label: 'Duplicate status',          value: metrics.duplicates,    pct: metrics.duplicateRate,      icon: Copy,          color: 'rose' },
    { label: 'Agent feedback',            value: metrics.agentPositive, pct: metrics.agentApprovalRate,  icon: MessageSquare, color: 'purple' },
    { label: 'Conversion status',         value: metrics.converted,     pct: metrics.conversionRate,     icon: Award,         color: 'amber' },
  ];

  const pieHasData = pieData.some((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Lead Health Distribution" subtitle="Valid vs duplicates vs invalid" icon={PieChartIcon} className="lg:col-span-1">
          <div className="h-72">
            {pieHasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-brand-ink/50">No lead data</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-brand-ink/70">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name}: <span className="font-bold tabular-nums">{formatNumber(d.value)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Indicator Breakdown" subtitle="Detailed lead quality metrics" icon={Layers} className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {indicators.map((ind) => {
              const Icon = ind.icon;
              const tone = COST_CARD_TONES[ind.color] || COST_CARD_TONES.purple;
              return (
                <div key={ind.label} className={`group rounded-xl border-2 ${tone.border} bg-gradient-to-br from-white to-brand-mist/30 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.fg}`}>
                      <Icon size={16} />
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${tone.bg} ${tone.fg}`}>
                      {formatPercent(ind.pct)}
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{ind.label}</p>
                  <div className="mt-1 flex items-end justify-between">
                    <p className={`font-display text-2xl font-bold tabular-nums ${tone.fg}`}>
                      {formatNumber(ind.value)}
                    </p>
                    <span className="text-[10px] font-medium text-brand-ink/45">leads</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-lilac/50">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${BAR_TONES[ind.color] || BAR_TONES.purple}`}
                      style={{ width: `${Math.min(100, Math.max(0, ind.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
});

/* ─────────── DUPLICATES TAB ─────────── */
const DuplicatesTab = memo(function DuplicatesTab({ metrics }) {
  const duplicateRate = metrics.duplicateRate;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <CostCard icon={Users}     label="Total Leads"     value={formatNumber(metrics.leads)}       formula="All lead records received"          tone="purple" />
        <CostCard icon={Copy}      label="Duplicate Leads" value={formatNumber(metrics.duplicates)}  formula={`${formatPercent(duplicateRate)} of total leads`} tone="rose" />
        <CostCard icon={UserCheck} label="Unique Leads"    value={formatNumber(metrics.uniqueLeads)} formula="Total leads excluding duplicates"   tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Duplicate Lead Analysis" subtitle="Understand repeated enquiries across campaigns" icon={Copy}>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-[12px] border-brand-lilac">
              <div
                className="absolute inset-[-12px] rounded-full"
                style={{
                  background: `conic-gradient(#E31C79 ${Math.min(100, duplicateRate)}%, #F0E5F7 0%)`,
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), black calc(100% - 11px))',
                }}
              />
              <div className="text-center">
                <p className="font-display text-4xl font-bold tabular-nums text-brand-magenta">
                  {formatPercent(duplicateRate)}
                </p>
                <p className="text-xs text-brand-ink/50">Duplicate Rate</p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-center text-sm text-brand-ink/60">
              {metrics.duplicates > 0
                ? `${formatNumber(metrics.duplicates)} duplicate records have been identified. Review them before assigning leads to agents.`
                : 'No duplicate records have been reported in the selected campaign.'}
            </p>
          </div>
        </Panel>

        <Panel title="Duplicate Quality Insights" subtitle="Impact on marketing lead quality" icon={Activity}>
          <div className="space-y-3">
            <InsightRow label="Duplicate Leads"      value={formatNumber(metrics.duplicates)}  description="Repeated lead records"                color="rose" />
            <InsightRow label="Unique Leads"         value={formatNumber(metrics.uniqueLeads)} description="Total leads excluding duplicates"     color="emerald" />
            <InsightRow label="Duplicate Percentage" value={formatPercent(duplicateRate)}      description="Share of total lead records"          color="amber" />

            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-purple" />
                <p className="text-xs font-bold text-brand-purple">Recommendation</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-brand-ink/70">
                Use phone number and email verification to identify repeated
                enquiries before distributing leads to agents.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
});

/* ─────────── AGENT FEEDBACK TAB ─────────── */
const FeedbackTab = memo(function FeedbackTab({ metrics }) {
  const approvalRate = metrics.agentApprovalRate;
  const notApproved = metrics.agentNotApproved;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <MetricCard
          icon={ThumbsUp}
          label="Agent Approved"
          value={formatNumber(metrics.agentPositive)}
          sub="Qualified leads accepted by agents"
          color="emerald"
        />

        <MetricCard
          icon={MessageCircle}
          label="Not Yet Approved"
          value={formatNumber(notApproved)}
          sub="Pending or not approved — status needs verification"
          color="rose"
        />

        <MetricCard
          icon={Award}
          label="Converted"
          value={formatNumber(metrics.converted)}
          sub="Leads successfully converted"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Agent Feedback Summary"
          subtitle="How agents evaluate marketing enquiries"
          icon={MessageSquare}
        >
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                  Agent Approval Rate
                </p>

                <p className="mt-1 font-display text-4xl font-bold tabular-nums text-emerald-600">
                  {formatPercent(approvalRate)}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ThumbsUp size={26} />
              </div>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-brand-lilac/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, approvalRate))}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
              <span>
                Approved: {formatNumber(metrics.agentPositive)}
              </span>

              <span>
                Not approved: {formatNumber(notApproved)}
              </span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Feedback Insights"
          subtitle="Lead acceptance and qualification"
          icon={Activity}
        >
          <div className="space-y-3">
            <InsightRow
              label="Agent Approved"
              value={formatNumber(metrics.agentPositive)}
              description="Leads considered useful by agents"
              color="emerald"
            />

            <InsightRow
              label="Not Yet Approved"
              value={formatNumber(notApproved)}
              description="Qualified leads without approval confirmation"
              color="rose"
            />

            <InsightRow
              label="Converted Leads"
              value={formatNumber(metrics.converted)}
              description="Leads successfully converted"
              color="purple"
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Agent Feedback Guidelines"
        subtitle="Recommended feedback categories for your CRM"
        icon={MessageCircle}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEEDBACK_GUIDELINES.map((item) => {
            const Icon = item.icon;
            const tone =
              COST_CARD_TONES[item.color] || COST_CARD_TONES.purple;

            return (
              <div
                key={item.title}
                className={`rounded-xl border ${tone.border} ${tone.bg} p-4`}
              >
                <div className={`flex items-center gap-2 ${tone.fg}`}>
                  <Icon size={17} />

                  <p className="text-xs font-bold">
                    {item.title}
                  </p>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-brand-ink/60">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   LEAF COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, sub, color = 'purple', delay = 0 }) {
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
        <p className={`truncate font-display text-2xl font-bold leading-tight tabular-nums ${t.valueColor}`}>{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </div>
  );
});

const Panel = memo(function Panel({ title, subtitle, action, icon: Icon, className = '', children }) {
  return (
    <div className={`group/panel relative min-w-0 overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/40 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)] transition-all duration-300 hover:border-brand-magenta/35 hover:shadow-[0_14px_36px_-16px_rgba(227,28,121,0.28)] ${className}`}>
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
    <div className={`group rounded-xl border ${METRIC_TILE_COLORS[color] || METRIC_TILE_COLORS.purple} p-3 transition-all hover:-translate-y-0.5 hover:shadow-md`}>
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
  const fg = METRIC_CARD_COLORS[color] || METRIC_CARD_COLORS.purple;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white to-brand-mist/40 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-magenta/40 hover:shadow-md">
      {Icon && (
        <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-mist ${fg}`}>
          <Icon size={16} />
        </span>
      )}
      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${fg}`}>{value}</p>
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
      <span className={`font-display text-base font-bold tabular-nums ${COST_ROW_TONES[tone] || COST_ROW_TONES.purple}`}>{value}</span>
    </div>
  );
});

const InsightRow = memo(function InsightRow({ label, value, description, color = 'purple' }) {
  const tone = COST_CARD_TONES[color] || COST_CARD_TONES.purple;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-white to-brand-mist/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-brand-ink">{label}</p>
        <p className="mt-0.5 text-[11px] text-brand-ink/50">{description}</p>
      </div>

      <span className={`shrink-0 rounded-lg px-3 py-1.5 font-display text-sm font-bold tabular-nums ${tone.bg} ${tone.fg}`}>
        {value}
      </span>
    </div>
  );
});

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-brand-magenta/30 bg-white px-3 py-2 shadow-[0_8px_24px_-8px_rgba(227,28,121,0.4)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-magenta">
        {label || payload[0]?.payload?.name}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-display text-sm font-bold text-brand-ink">
          {typeof p.value === 'number' ? formatNumber(p.value) : p.value}
          {p.name && p.name !== (label || payload[0]?.payload?.name) && (
            <span className="ml-1 text-xs font-normal text-brand-ink/60">{p.name}</span>
          )}
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
        {message || 'No lead quality data yet'}
      </p>
      <p className="max-w-sm text-sm text-brand-ink/50">
        Campaign lead quality information will appear here once campaign data is available.
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