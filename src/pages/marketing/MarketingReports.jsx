
import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, CheckCircle2, AlertTriangle, ChevronDown, Award, BarChart3,
  Calendar, XCircle, Megaphone, Layers, Sparkles, DollarSign, Globe
} from 'lucide-react';

const COLORS = ['#E31C79', '#8B2FD6', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#14B8A6', '#F97316'];

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */
const RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Month'];

const CHART_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #F1E4FB',
  fontSize: 12,
  boxShadow: '0 8px 24px -8px rgba(227,28,121,0.25)',
  padding: '8px 12px',
};

const GRID_STROKE = '#F1E4FB';
const AXIS_TICK = { fontSize: 11, fill: '#8b7a9e', fontWeight: 500 };

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'leads', label: 'Lead Reports', icon: Layers },
  { key: 'campaigns', label: 'Campaign Reports', icon: Megaphone },
  { key: 'sources', label: 'Source Reports', icon: Globe },
  { key: 'performance', label: 'Executive Performance', icon: Award },
  { key: 'costs', label: 'Cost Reports', icon: DollarSign },
  { key: 'marketing', label: 'Marketing Performance', icon: TrendingUp },
];

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const MOCK_TRENDS = [
  { day: '01 Oct', leads: 120, spend: 1500, conversions: 12 },
  { day: '05 Oct', leads: 150, spend: 1800, conversions: 15 },
  { day: '10 Oct', leads: 180, spend: 2000, conversions: 22 },
  { day: '15 Oct', leads: 140, spend: 1600, conversions: 18 },
  { day: '20 Oct', leads: 210, spend: 2500, conversions: 30 },
  { day: '25 Oct', leads: 250, spend: 2800, conversions: 35 },
];

const MOCK_LEADS = {
  total: 1050, fresh: 350, valid: 800, duplicate: 150, qualified: 400, converted: 120, lost: 180,
  statusData: [
    { name: 'Fresh', value: 350, fill: '#8B2FD6' },
    { name: 'Qualified', value: 400, fill: '#6366F1' },
    { name: 'Converted', value: 120, fill: '#10B981' },
    { name: 'Lost', value: 180, fill: '#94A3B8' },
  ],
  sourceData: [
    { name: 'Google Ads', value: 450, spend: 6975, cpl: 15.5, conv: 35 },
    { name: 'Meta Ads', value: 320, spend: 2624, cpl: 8.2, conv: 22 },
    { name: 'Website', value: 210, spend: 0, cpl: 0, conv: 18 },
    { name: 'WhatsApp', value: 150, spend: 315, cpl: 2.1, conv: 12 },
    { name: 'Referral', value: 85, spend: 425, cpl: 5.0, conv: 10 },
    { name: 'Events', value: 45, spend: 2025, cpl: 45.0, conv: 4 },
  ],
};

const MOCK_CAMPAIGNS = [
  { name: 'Summer Sale', leads: 320, spend: 2624, cpl: 8.20, qualified: 85, converted: 22, rate: 6.875 },
  { name: 'Search - CRM', leads: 450, spend: 6975, cpl: 15.50, qualified: 120, converted: 35, rate: 7.778 },
  { name: 'B2B Outreach', leads: 60, spend: 1320, cpl: 22.00, qualified: 25, converted: 8, rate: 13.333 },
  { name: 'Reel Campaign', leads: 95, spend: 646, cpl: 6.80, qualified: 28, converted: 5, rate: 5.263 },
];

const MOCK_EXECUTIVES = [
  { name: 'Ravi Sharma', campaigns: 3, leads: 450, processed: 400, handed: 150, qualified: 120, contribution: 12 },
  { name: 'Anita Desai', campaigns: 2, leads: 320, processed: 320, handed: 100, qualified: 85, contribution: 8 },
  { name: 'Kiran Rao', campaigns: 4, leads: 280, processed: 250, handed: 90, qualified: 70, contribution: 5 },
];

const MOCK_SOURCES = MOCK_LEADS.sourceData.map((source) => ({
  name: source.name,
  leads: source.value,
  spend: source.spend,
  cpl: source.value > 0 ? source.spend / source.value : 0,
  conv: source.conv,
  roi: source.spend > 0 ? ((source.conv * 520 - source.spend) / source.spend) * 100 : 0,
}));

const TOP_SOURCE = [...MOCK_SOURCES].sort((a, b) => b.leads - a.leads)[0];

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const calculatePercentage = (value, total) => total > 0 ? (value / total) * 100 : 0;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingReports() {
  const [range, setRange] = useState('Last 7 Days');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabClick = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FDF8FE] via-white to-[#FBF3FF]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-magenta/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-brand-purple/[0.05] blur-3xl" />

      <div className="relative space-y-5 px-1 py-1 pb-40">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">Marketing Reports</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <TrendingUp size={13} className="text-brand-magenta" />
              Convert Marketing Data Into Actionable Information
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setRangeOpen((s) => !s)}
                aria-expanded={rangeOpen}
                className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink shadow-sm transition-all hover:border-brand-magenta/40 hover:shadow-md"
              >
                <Calendar size={14} className="text-brand-magenta" />
                {range}
                <ChevronDown size={14} className={`text-brand-ink/40 transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
              </button>
              {rangeOpen && (
                <>
                  <button type="button" aria-label="Close date range menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setRangeOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-brand-lilac bg-white p-1 shadow-panel">
                    {RANGES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => { setRange(r); setRangeOpen(false); }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm ${range === r ? 'bg-brand-magenta/10 font-semibold text-brand-magenta' : 'text-brand-ink/70 hover:bg-brand-lilac/40'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STAT CARDS STRIP */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Summary</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">Key Performance Indicators</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <StatCard icon={Layers} label="Total Leads" value={MOCK_LEADS.total} sub={`${MOCK_LEADS.fresh} fresh`} color="purple" onClick={() => handleTabClick('leads')} active={activeTab === 'leads'} delay={0} />
            <StatCard icon={Target} label="Conversion" value={`${calculatePercentage(MOCK_LEADS.converted, MOCK_LEADS.total).toFixed(1)}%`} sub={`${MOCK_LEADS.converted} won`} color="emerald" onClick={() => handleTabClick('marketing')} active={activeTab === 'marketing'} delay={40} />
            <StatCard icon={DollarSign} label="Total Spend" value={formatCurrency(MOCK_SOURCES.reduce((sum, source) => sum + source.spend, 0))} sub="Across channels" color="rose" onClick={() => handleTabClick('costs')} active={activeTab === 'costs'} delay={80} />
            <StatCard icon={Megaphone} label="Campaigns" value={MOCK_CAMPAIGNS.length} sub="Campaign records" color="amber" onClick={() => handleTabClick('campaigns')} active={activeTab === 'campaigns'} delay={120} />
            <StatCard icon={Globe} label="Top Source" value={TOP_SOURCE.name} sub={`${TOP_SOURCE.leads} leads`} color="purple" onClick={() => handleTabClick('sources')} active={activeTab === 'sources'} delay={160} />
          </div>
        </div>

        {/* TABS */}
        <div className="card !p-2">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleTabClick(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${active ? 'scale-[1.02] bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)]' : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'}`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'overview' && <OverviewTab range={range} />}
        {activeTab === 'leads' && <LeadReportsTab />}
        {activeTab === 'campaigns' && <CampaignReportsTab />}
        {activeTab === 'sources' && <SourceReportsTab />}
        {activeTab === 'performance' && <ExecutivePerformanceTab />}
        {activeTab === 'costs' && <CostReportsTab />}
        {activeTab === 'marketing' && <MarketingPerformanceTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE STAT CARD
   ═══════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, sub, color = 'purple', active, onClick, delay = 0 }) {
  const themes = {
    purple: { border: 'border-violet-200 hover:border-violet-400', bg: 'from-violet-50 via-violet-50/30 to-white', iconBg: 'bg-violet-100 text-brand-purple border-violet-200', bar: 'from-brand-purple to-brand-magenta', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(139,47,214,0.45)]', valueColor: 'text-brand-purple', ring: 'ring-violet-300' },
    emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'from-emerald-50 via-emerald-50/30 to-white', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200', bar: 'from-emerald-500 to-emerald-400', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.4)]', valueColor: 'text-emerald-600', ring: 'ring-emerald-300' },
    amber: { border: 'border-amber-200 hover:border-amber-400', bg: 'from-amber-50 via-amber-50/30 to-white', iconBg: 'bg-amber-100 text-amber-600 border-amber-200', bar: 'from-amber-500 to-orange-400', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(245,158,11,0.4)]', valueColor: 'text-amber-600', ring: 'ring-amber-300' },
    rose: { border: 'border-rose-200 hover:border-rose-400', bg: 'from-rose-50 via-rose-50/30 to-white', iconBg: 'bg-rose-100 text-brand-magenta border-rose-200', bar: 'from-brand-magenta to-brand-purple', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(227,28,121,0.45)]', valueColor: 'text-brand-magenta', ring: 'ring-rose-300' },
  };

  const t = themes[color] || themes.purple;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/30 p-4 text-left shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 hover:-translate-y-1.5 animate-fade-slide-in ${t.border} ${active ? `ring-2 ${t.ring} ${t.shadow}` : t.shadow}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100 ${active ? 'scale-x-100' : ''}`} />
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${active ? 'opacity-100' : ''}`} />

      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.iconBg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
          <Icon size={18} />
        </span>
        {active && (
          <span className="flex items-center gap-1 rounded-full bg-brand-magenta/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-magenta ring-1 ring-brand-magenta/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-magenta opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-magenta" />
            </span>
            Active
          </span>
        )}
      </div>

      <div className="relative z-10 w-full">
        <p className={`font-display text-2xl font-bold leading-tight tabular-nums ${t.valueColor}`}>{typeof value === 'number' ? formatNumber(value) : value}</p>
        <p className="mt-0.5 text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </button>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-brand-lilac bg-white shadow-sm transition-all hover:border-brand-magenta/30 hover:shadow-md ${className}`}>
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-magenta/30 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-lilac/60 bg-gradient-to-r from-brand-mist/60 to-transparent px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-sm">
              <Icon size={16} />
            </span>
          )}
          <div>
            <h3 className="font-display text-sm font-bold text-brand-ink">{title}</h3>
            {subtitle && <p className="text-[11px] text-brand-ink/50">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KPITile({ icon: Icon, label, value, color = 'purple' }) {
  const colors = {
    purple: 'from-violet-50 to-white text-brand-purple border-violet-200',
    emerald: 'from-emerald-50 to-white text-emerald-600 border-emerald-200',
    amber: 'from-amber-50 to-white text-amber-600 border-amber-200',
    rose: 'from-rose-50 to-white text-brand-magenta border-rose-200',
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${colors[color]} p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
      <div className="relative flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 shadow-sm"><Icon size={14} /></span>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      </div>
      <p className="relative mt-2 font-display text-2xl font-bold tabular-nums">{typeof value === 'number' ? formatNumber(value) : value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: OVERVIEW
   ═══════════════════════════════════════════════════════════════ */
function OverviewTab({ range }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="Marketing Trend" subtitle={`Leads & Spend · ${range}`} icon={TrendingUp} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_TRENDS} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="reports-ov-leads-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E31C79" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E31C79" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={6} />
                <YAxis yAxisId="left" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area yAxisId="left" type="monotone" dataKey="leads" stroke="#E31C79" strokeWidth={3} fill="url(#reports-ov-leads-grad)" name="Leads" />
                <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#8B2FD6" strokeWidth={2.5} dot={{ r: 3 }} name="Spend ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Lead Sources" subtitle="Distribution by channel" icon={Layers}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK_SOURCES} dataKey="leads" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {MOCK_SOURCES.map((source, i) => <Cell key={source.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2: LEAD REPORTS
   ═══════════════════════════════════════════════════════════════ */
function LeadReportsTab() {
  const funnelData = [
    { label: 'Total Leads', value: MOCK_LEADS.total, fill: '#8B2FD6' },
    { label: 'Valid Leads', value: MOCK_LEADS.valid, fill: '#A855F7' },
    { label: 'Qualified', value: MOCK_LEADS.qualified, fill: '#E31C79' },
    { label: 'Converted', value: MOCK_LEADS.converted, fill: '#10B981' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPITile icon={Layers} label="Total Leads" value={MOCK_LEADS.total} color="purple" />
        <KPITile icon={Sparkles} label="New (Fresh)" value={MOCK_LEADS.fresh} color="rose" />
        <KPITile icon={CheckCircle2} label="Valid Leads" value={MOCK_LEADS.valid} color="emerald" />
        <KPITile icon={AlertTriangle} label="Duplicate" value={MOCK_LEADS.duplicate} color="amber" />
        <KPITile icon={Target} label="Qualified" value={MOCK_LEADS.qualified} color="purple" />
        <KPITile icon={XCircle} label="Lost" value={MOCK_LEADS.lost} color="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Lead Status Pipeline" subtitle="Current status of all leads" icon={BarChart3}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_LEADS.statusData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#F1E4FB' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                  {MOCK_LEADS.statusData.map((s) => <Cell key={s.name} fill={s.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Lead Conversion Funnel" subtitle="Step-by-step lead progression" icon={Target}>
          <div className="mt-4 space-y-4">
            {funnelData.map((step) => {
              const pct = calculatePercentage(step.value, MOCK_LEADS.total);
              return (
                <div key={step.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-ink">{step.label}</span>
                    <span className="font-mono font-bold text-brand-ink tabular-nums">{formatNumber(step.value)} · <span className="text-brand-magenta">{pct.toFixed(1)}%</span></span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-lg bg-brand-lilac/40">
                    <div className="flex h-full items-center justify-end rounded-lg px-3 text-[10px] font-bold text-white transition-all duration-1000" style={{ width: `${Math.max(pct, 10)}%`, background: step.fill }}>
                      {pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3: CAMPAIGN REPORTS
   ═══════════════════════════════════════════════════════════════ */
function CampaignReportsTab() {
  return (
    <div className="space-y-5">
      <ChartCard title="Campaign Performance" subtitle="Leads, Spend, and Conversion Rates" icon={Megaphone}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-brand-lilac/60 text-left">
                <th className="px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Campaign</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Leads</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Spend</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">CPL</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Qualified</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Converted</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CAMPAIGNS.map((c) => (
                <tr key={c.name} className="border-b border-brand-lilac/40 transition-colors hover:bg-brand-mist/30">
                  <td className="px-3 py-3 font-semibold text-brand-ink">{c.name}</td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatNumber(c.leads)}</td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatCurrency(c.spend)}</td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatCurrency(c.leads > 0 ? c.spend / c.leads : 0)}</td>
                  <td className="px-3 py-3 text-center font-semibold text-brand-purple tabular-nums">{formatNumber(c.qualified)}</td>
                  <td className="px-3 py-3 text-center font-semibold text-emerald-600 tabular-nums">{formatNumber(c.converted)}</td>
                  <td className="px-3 py-3">
                    <div className="mx-auto flex max-w-[110px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-lilac">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple" style={{ width: `${Math.min(c.rate, 100)}%` }} />
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-brand-magenta tabular-nums">{c.rate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4: SOURCE REPORTS
   ═══════════════════════════════════════════════════════════════ */
function SourceReportsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Source Comparison" subtitle="Leads by channel" icon={Globe}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_SOURCES} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#F1E4FB' }} />
                <Bar dataKey="leads" radius={[0, 6, 6, 0]} barSize={22}>
                  {MOCK_SOURCES.map((source, i) => <Cell key={source.name} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cost vs Conversions" subtitle="CPL and conversions per source" icon={DollarSign}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_SOURCES} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#F1E4FB' }} />
                <Bar yAxisId="left" dataKey="cpl" fill="#8B2FD6" radius={[4, 4, 0, 0]} barSize={18} name="CPL ($)" />
                <Line yAxisId="right" type="monotone" dataKey="conv" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} name="Conversions" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Source Performance Details" subtitle="Leads, advertising spend and acquisition costs" icon={Layers}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-brand-lilac/60 text-left">
                <th className="px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Source</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Leads</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Spend</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">CPL</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SOURCES.map((source) => (
                <tr key={source.name} className="border-b border-brand-lilac/40 hover:bg-brand-mist/30">
                  <td className="px-3 py-3 font-semibold text-brand-ink">{source.name}</td>
                  <td className="px-3 py-3 text-center tabular-nums text-brand-ink/70">{formatNumber(source.leads)}</td>
                  <td className="px-3 py-3 text-center tabular-nums text-brand-ink/70">{formatCurrency(source.spend)}</td>
                  <td className="px-3 py-3 text-center tabular-nums text-brand-purple">{formatCurrency(source.cpl)}</td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums text-emerald-600">{formatNumber(source.conv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: EXECUTIVE PERFORMANCE
   ═══════════════════════════════════════════════════════════════ */
function ExecutivePerformanceTab() {
  return (
    <div className="space-y-5">
      <ChartCard title="Executive Scorecard" subtitle="Campaigns managed & lead contribution" icon={Award}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-brand-lilac/60 text-left">
                <th className="px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Executive</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Campaigns</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Leads Gen.</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Leads Proc.</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Handed Over</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Qualified</th>
                <th className="px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/50">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EXECUTIVES.map((e) => (
                <tr key={e.name} className="border-b border-brand-lilac/40 transition-colors hover:bg-brand-mist/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple text-[10px] font-bold text-white">
                        {e.name.split(' ').map(n => n[0]).join('')}
                      </span>
                      <span className="font-semibold text-brand-ink">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatNumber(e.campaigns)}</td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatNumber(e.leads)}</td>
                  <td className="px-3 py-3 text-center text-brand-ink/70 tabular-nums">{formatNumber(e.processed)}</td>
                  <td className="px-3 py-3 text-center font-semibold text-brand-purple tabular-nums">{formatNumber(e.handed)}</td>
                  <td className="px-3 py-3 text-center font-semibold text-emerald-600 tabular-nums">{formatNumber(e.qualified)}</td>
                  <td className="px-3 py-3">
                    <div className="mx-auto flex max-w-[110px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-lilac">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple" style={{ width: `${Math.min(e.contribution, 100)}%` }} />
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-brand-magenta tabular-nums">{e.contribution}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 6: COST REPORTS
   ═══════════════════════════════════════════════════════════════ */
function CostReportsTab() {
  const totalSpend = MOCK_SOURCES.reduce((sum, source) => sum + source.spend, 0);
  const totalLeads = MOCK_SOURCES.reduce((sum, source) => sum + source.leads, 0);
  const totalConv = MOCK_SOURCES.reduce((sum, source) => sum + source.conv, 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpa = totalConv > 0 ? totalSpend / totalConv : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPITile icon={DollarSign} label="Total Ad Spend" value={formatCurrency(totalSpend)} color="rose" />
        <KPITile icon={TrendingUp} label="Avg CPL" value={formatCurrency(avgCPL)} color="purple" />
        <KPITile icon={Target} label="Cost Per Conv." value={formatCurrency(cpa)} color="amber" />
        <KPITile icon={CheckCircle2} label="Total Conversions" value={totalConv} color="emerald" />
      </div>

      <ChartCard title="Spend Distribution" subtitle="Actual advertising spend across channels" icon={DollarSign}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_SOURCES} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#F1E4FB' }} formatter={(value) => [formatCurrency(value), 'Ad Spend']} />
              <Bar dataKey="spend" fill="#E31C79" radius={[6, 6, 0, 0]} barSize={32} name="Ad Spend" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 7: MARKETING PERFORMANCE
   ═══════════════════════════════════════════════════════════════ */
function MarketingPerformanceTab() {
  const totalSpend = MOCK_SOURCES.reduce((sum, source) => sum + source.spend, 0);
  const totalRevenue = MOCK_LEADS.converted * 520;
  const totalProfit = totalRevenue - totalSpend;
  const roi = totalSpend > 0 ? (totalProfit / totalSpend) * 100 : 0;
  const avgDealSize = MOCK_LEADS.converted > 0 ? totalRevenue / MOCK_LEADS.converted : 0;
  const conversionRate = calculatePercentage(MOCK_LEADS.converted, MOCK_LEADS.total);

  return (
    <div className="space-y-5">
      <ChartCard title="Overall ROI & Funnel" subtitle="Marketing efficiency breakdown" icon={TrendingUp}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/30 p-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Overall ROI</p>
              <p className="font-display text-2xl font-bold text-emerald-600">{roi.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-brand-ink/60">Return on marketing investment</p>
            </div>
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/30 p-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Total Revenue</p>
              <p className="font-display text-2xl font-bold text-brand-purple">{formatCurrency(totalRevenue)}</p>
              <p className="mt-1 text-xs text-brand-ink/60">Estimated revenue from converted leads</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/30 p-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Avg Deal Size</p>
              <p className="font-display text-2xl font-bold text-brand-magenta">{formatCurrency(avgDealSize)}</p>
              <p className="mt-1 text-xs text-brand-ink/60">Per converted customer</p>
            </div>
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/30 p-4">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Conversion Rate</p>
              <p className="font-display text-2xl font-bold text-amber-600">{conversionRate.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-brand-ink/60">Lead to customer ratio</p>
            </div>
          </div>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ChartCard title="Marketing Funnel" subtitle="Lead-to-customer conversion" icon={Target}>
          <div className="space-y-4">
            {[
              { label: 'Total Leads', value: MOCK_LEADS.total, color: '#8B2FD6' },
              { label: 'Valid Leads', value: MOCK_LEADS.valid, color: '#A855F7' },
              { label: 'Qualified Leads', value: MOCK_LEADS.qualified, color: '#E31C79' },
              { label: 'Converted Leads', value: MOCK_LEADS.converted, color: '#10B981' },
            ].map((item) => {
              const percentage = calculatePercentage(item.value, MOCK_LEADS.total);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-ink">{item.label}</span>
                    <span className="font-mono font-bold text-brand-ink">{formatNumber(item.value)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-brand-lilac/40">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Revenue vs Marketing Spend" subtitle="Estimated financial performance" icon={DollarSign}>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-ink">Revenue</span>
                <span className="font-mono font-bold text-emerald-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-brand-lilac/40">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-ink">Marketing Spend</span>
                <span className="font-mono font-bold text-brand-magenta">{formatCurrency(totalSpend)}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-brand-lilac/40">
                <div className="h-full rounded-full bg-brand-magenta" style={{ width: `${totalRevenue > 0 ? Math.min((totalSpend / totalRevenue) * 100, 100) : 0}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-brand-lilac bg-brand-mist/30 p-4">
              <p className="text-xs font-semibold text-brand-ink/60">Estimated Net Return</p>
              <p className={`mt-1 font-display text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
