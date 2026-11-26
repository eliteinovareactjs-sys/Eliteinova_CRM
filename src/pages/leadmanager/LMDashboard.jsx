// src/pages/leadmanager/LMDashboard.jsx
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Sparkles, Users, UserCheck, Phone, Flame, Calendar, Target,
  Award, XCircle, AlertTriangle, LayoutDashboard, RefreshCw, Download,
  Building2, ChevronRight, ArrowRight, BarChart3, TrendingUp, Plus,
  UserPlus, ListChecks, CheckCircle2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell,
} from 'recharts';

import { useAuth } from '../../context/AuthContext';
import { AGENTS, LEADS, FOLLOW_UPS } from '../../data/mockData';

const COLORS = ['#E31C79', '#8B2FD6', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];

/* ═══════════════════════════════════════════════════════════════════
   ROUTE MAP — adjust to your Lead Manager routes
   ═══════════════════════════════════════════════════════════════════ */
const ROUTES = {
  allLeads:  '/lead-manager/leads',
  assign:    '/lead-manager/assign',
  followUps: '/lead-manager/follow-ups',
  tasks:     '/lead-manager/tasks',
  agents:    '/lead-manager/agents',
};

/* Status matching is case/space-insensitive and accepts common aliases */
const norm = (v) => String(v ?? '').toLowerCase().replace(/[\s_-]+/g, '');
const STATUS_ALIASES = {
  fresh:      ['fresh', 'new'],
  contacted:  ['contacted'],
  interested: ['interested', 'hot'],
  followUp:   ['followup', 'followups', 'callback'],
  qualified:  ['qualified'],
  converted:  ['won', 'converted'],
  lost:       ['lost', 'dead', 'notinterested', 'closedlost'],
};
const isStatus = (lead, key) => STATUS_ALIASES[key].includes(norm(lead.status));
const isAssigned = (lead) =>
  !!lead.assignedAgent && norm(lead.assignedAgent) !== 'unassigned';

export default function LMDashboard() {
  const navigate = useNavigate();
  const { user, activeWebsiteId, activeWebsite } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  /* ========== SCOPED DATA ========== */
  const agents = useMemo(
    () => (AGENTS || []).filter((a) => a.websiteId === activeWebsiteId),
    [activeWebsiteId]
  );
  const leads = useMemo(
    () => (LEADS || []).filter((l) => l.websiteId === activeWebsiteId),
    [activeWebsiteId]
  );
  const followUps = useMemo(
    () => (FOLLOW_UPS || []).filter((f) => (f.projectId ?? f.websiteId) === activeWebsiteId),
    [activeWebsiteId]
  );

  /* ========== KPI METRICS ========== */
  const metrics = useMemo(() => {
    const total = leads.length;
    const assigned = leads.filter(isAssigned).length;
    const converted = leads.filter((l) => isStatus(l, 'converted')).length;

    /* Follow-up leads: status says follow-up OR lead has an open follow-up */
    const openFollowUpLeadIds = new Set(
      followUps
        .filter((f) => ['today', 'upcoming', 'overdue'].includes(norm(f.status)) && f.leadId != null)
        .map((f) => f.leadId)
    );
    const followUpLeads = leads.filter(
      (l) => isStatus(l, 'followUp') || openFollowUpLeadIds.has(l.id)
    ).length;

    return {
      total,
      newLeads: leads.filter((l) => isStatus(l, 'fresh')).length,
      unassigned: total - assigned,
      assigned,
      contacted: leads.filter((l) => isStatus(l, 'contacted')).length,
      interested: leads.filter((l) => isStatus(l, 'interested')).length,
      followUpLeads,
      qualified: leads.filter((l) => isStatus(l, 'qualified')).length,
      converted,
      lost: leads.filter((l) => isStatus(l, 'lost')).length,
      overdue: followUps.filter((f) => norm(f.status) === 'overdue').length,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
      assignmentRate: total ? Math.round((assigned / total) * 100) : 0,
    };
  }, [leads, followUps]);

  /* ========== PIPELINE + SOURCE + WORKLOAD ========== */
  const pipelineData = useMemo(() => [
    { name: 'New',        value: metrics.newLeads,   color: '#6366F1' },
    { name: 'Contacted',  value: metrics.contacted,  color: '#8B2FD6' },
    { name: 'Interested', value: metrics.interested, color: '#EC4899' },
    { name: 'Follow-up',  value: metrics.followUpLeads, color: '#F59E0B' },
    { name: 'Qualified',  value: metrics.qualified,  color: '#10B981' },
    { name: 'Converted',  value: metrics.converted,  color: '#E31C79' },
    { name: 'Lost',       value: metrics.lost,       color: '#94A3B8' },
  ], [metrics]);

  const bySource = useMemo(() => {
    const map = {};
    leads.forEach((l) => {
      const key = l.leadSource || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const agentWorkload = useMemo(
    () =>
      agents
        .map((a) => {
          const mine = leads.filter((l) => l.assignedAgent === a.name);
          const won = mine.filter((l) => isStatus(l, 'converted')).length;
          return {
            id: a.id,
            name: a.name,
            status: a.status,
            leads: mine.length,
            won,
            rate: mine.length ? Math.round((won / mine.length) * 100) : 0,
          };
        })
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5),
    [agents, leads]
  );

  /* ========== HANDLERS ========== */
  const handleRefresh = () => {
    setRefreshed(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshed(false), 1200);
  };

  const handleExport = () => {
    const rows = [
      ['Lead Manager Dashboard Report', ''],
      ['Website', activeWebsite?.name || ''],
      ['Total Leads', metrics.total],
      ['New Leads', metrics.newLeads],
      ['Unassigned Leads', metrics.unassigned],
      ['Assigned Leads', metrics.assigned],
      ['Contacted Leads', metrics.contacted],
      ['Interested Leads', metrics.interested],
      ['Follow-up Leads', metrics.followUpLeads],
      ['Qualified Leads', metrics.qualified],
      ['Converted Leads', metrics.converted],
      ['Lost Leads', metrics.lost],
      ['Overdue Follow-ups', metrics.overdue],
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-manager-report-${activeWebsiteId}-${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FBE9F3] via-[#FDF6FB] to-[#EDE1FB]">
      {/* Ambient color anchors */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand-magenta/[0.14] blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-purple/[0.13] blur-3xl animate-float-slower" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-brand-rose/[0.10] blur-3xl animate-float-slow" />

      {/* Fine grid texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,47,214,0.10) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        key={refreshKey}
        className={`relative space-y-6 px-1 pb-10 transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
      >
        {/* ================= HEADER ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">Lead Manager Dashboard</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/60">
              <LayoutDashboard size={13} className="text-brand-magenta" />
              {greeting}{user?.name ? `, ${user.name}` : ''} · Real-time summary of the complete lead pipeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeWebsite?.name && (
              <div className="group flex items-center gap-2 rounded-full border border-brand-magenta/25 bg-gradient-to-r from-brand-magenta/[0.12] to-brand-purple/[0.10] px-4 py-2 text-sm font-semibold text-brand-purple shadow-sm transition-all hover:border-brand-magenta/50 hover:shadow-md">
                <Building2 size={16} className="transition-transform group-hover:rotate-6" />
                {activeWebsite.name}
              </div>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className={`rounded-full border border-brand-lilac bg-white p-2.5 shadow-sm transition-all duration-500 ${
                refreshed
                  ? 'rotate-[360deg] text-brand-magenta border-brand-magenta/40 shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)]'
                  : 'text-brand-ink/60 hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta'
              }`}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            {/* <button
              type="button"
              onClick={handleExport}
              className="group inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-magenta/40 hover:bg-brand-magenta/[0.03] hover:shadow-md"
            >
              <Download size={14} className="transition-transform group-hover:translate-y-0.5" />
              Export
            </button> */}
          </div>
        </div>

        {/* ================= PIPELINE BANNER ================= */}
        <div className="group relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-brand-magenta/30 bg-gradient-to-r from-brand-magenta/[0.14] via-brand-purple/[0.10] to-brand-rose/[0.10] px-5 py-4 shadow-[0_10px_30px_-18px_rgba(227,28,121,0.5)] transition-all hover:border-brand-magenta/50 hover:shadow-[0_14px_36px_-16px_rgba(227,28,121,0.55)]">
          <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rotate-45 bg-gradient-to-br from-brand-magenta/[0.15] to-transparent" />
          <span className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-brand-purple/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-[0_6px_18px_-6px_rgba(227,28,121,0.6)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-magenta">Pipeline Overview</p>
              <p className="font-display text-base font-bold text-brand-ink">{activeWebsite?.name || 'Lead Pipeline'}</p>
              <p className="text-xs font-medium text-brand-ink/60">
                {metrics.total} leads · {agents.length} agents · {metrics.conversionRate}% conversion
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-3">
            {[
              { label: 'Assignment', value: `${metrics.assignmentRate}%`, icon: UserCheck, color: 'text-brand-purple', bg: 'bg-violet-50', ring: 'ring-violet-200' },
              { label: 'Conversion', value: `${metrics.conversionRate}%`, icon: Target, color: 'text-brand-magenta', bg: 'bg-rose-50', ring: 'ring-rose-200' },
              { label: 'Overdue', value: metrics.overdue, icon: AlertTriangle, color: metrics.overdue > 0 ? 'text-rose-600' : 'text-emerald-600', bg: metrics.overdue > 0 ? 'bg-rose-50' : 'bg-emerald-50', ring: metrics.overdue > 0 ? 'ring-rose-200' : 'ring-emerald-200' },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className={`group/pill flex items-center gap-2 rounded-full border border-white/70 ${m.bg} px-3.5 py-2 shadow-md ring-1 ${m.ring} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
                >
                  <Icon size={14} className={`${m.color} transition-transform group-hover/pill:scale-110`} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/50">{m.label}</p>
                    <p className="text-sm font-bold text-brand-ink">{m.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 11 KPI CARDS ================= */}
        <div className="space-y-3">
          <SectionTitle eyebrow="Live Metrics" title="Key Performance Cards" hint="Complete lead pipeline" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            <KPICard icon={Layers}        label="Total Leads"       value={metrics.total}         color="purple"  sub="All in project"       to={ROUTES.allLeads}  delay={0} />
            <KPICard icon={Sparkles}      label="New Leads"         value={metrics.newLeads}      color="purple"  sub="Awaiting processing"  to={ROUTES.allLeads}  delay={40} />
            <KPICard icon={Users}         label="Unassigned Leads"  value={metrics.unassigned}    color="amber"   sub="Awaiting assignment"  to={ROUTES.assign}    alert={metrics.unassigned > 0} delay={80} />
            <KPICard icon={UserCheck}     label="Assigned Leads"    value={metrics.assigned}      color="emerald" sub="With an agent"        to={ROUTES.allLeads}  delay={120} />
            <KPICard icon={Phone}         label="Contacted Leads"   value={metrics.contacted}     color="purple"  sub="Reached out"          to={ROUTES.allLeads}  delay={160} />
            <KPICard icon={Flame}         label="Interested Leads"  value={metrics.interested}    color="rose"    sub="Showing interest"     to={ROUTES.allLeads}  delay={200} />
            <KPICard icon={Calendar}      label="Follow-up Leads"   value={metrics.followUpLeads} color="amber"   sub="Need interaction"     to={ROUTES.followUps} delay={240} />
            <KPICard icon={Target}        label="Qualified Leads"   value={metrics.qualified}     color="emerald" sub="Meet criteria"        to={ROUTES.allLeads}  delay={280} />
            <KPICard icon={Award}         label="Converted Leads"   value={metrics.converted}     color="emerald" sub={`${metrics.conversionRate}% rate`} to={ROUTES.allLeads} delay={320} />
            <KPICard icon={XCircle}       label="Lost Leads"        value={metrics.lost}          color="rose"    sub="No longer active"     to={ROUTES.allLeads}  delay={360} />
            <KPICard icon={AlertTriangle} label="Overdue Follow-ups" value={metrics.overdue}      color="rose"    sub="Needs attention"      to={ROUTES.followUps} alert={metrics.overdue > 0} delay={400} />
          </div>
        </div>

        {/* ================= ANALYTICS ================= */}
        <div className="space-y-3">
          <SectionTitle eyebrow="Analytics" title="Pipeline Snapshot" hint="Live breakdowns" />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Pipeline by stage */}
            <Panel title="Pipeline by Stage" subtitle="Leads currently in each stage" icon={TrendingUp} className="lg:col-span-2">
              {metrics.total === 0 ? (
                <EmptyState message="No leads in this project yet" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#E9D5F5" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b5b7e', fontWeight: 600 }} axisLine={false} tickLine={false} dy={6} />
                      <YAxis tick={{ fontSize: 11, fill: '#8b7a9e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1E4FB', radius: 8 }} />
                      <Bar dataKey="value" name="Leads" radius={[8, 8, 2, 2]} barSize={34}>
                        {pipelineData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            {/* Lead source */}
            <Panel title="Lead Source" subtitle={`${bySource.length} channels`} icon={BarChart3}>
              {bySource.length === 0 ? (
                <EmptyState message="No source data yet" />
              ) : (
                <div className="space-y-3">
                  {bySource.slice(0, 6).map((s, i) => (
                    <div key={s.name} className="group">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-brand-ink/80">
                          <span className="h-2 w-2 rounded-full transition-transform group-hover:scale-150" style={{ background: COLORS[i % COLORS.length] }} />
                          {s.name}
                        </span>
                        <span className="font-mono font-bold text-brand-ink">{s.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-brand-lilac">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(s.value / (bySource[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Assignment & follow-up health */}
            <Panel title="Assignment & Follow-up Health" subtitle="Where the pipeline needs attention" icon={Calendar}>
              <div className="space-y-5">
                <ProgressRow
                  label="Assignment coverage"
                  value={metrics.assignmentRate}
                  caption={`${metrics.assigned} assigned · ${metrics.unassigned} unassigned`}
                />
                <ProgressRow
                  label="Conversion rate"
                  value={metrics.conversionRate}
                  caption={`${metrics.converted} of ${metrics.total} leads converted`}
                />
                <ProgressRow
                  label="Follow-up compliance"
                  value={followUps.length ? Math.max(0, Math.round(((followUps.length - metrics.overdue) / followUps.length) * 100)) : 0}
                  caption={`${metrics.overdue} overdue of ${followUps.length} follow-ups`}
                />
              </div>
            </Panel>

            {/* Agent workload */}
            <Panel
              title="Agent Workload"
              subtitle={`Top ${agentWorkload.length} of ${agents.length}`}
              icon={Award}
              action={
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.agents)}
                  className="group inline-flex items-center gap-1 text-[11px] font-semibold text-brand-magenta hover:underline"
                >
                  View all <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              }
            >
              {agentWorkload.length === 0 ? (
                <EmptyState message="No agents yet" />
              ) : (
                <div className="space-y-2.5">
                  {agentWorkload.map((a) => (
                    <div
                      key={a.id}
                      className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-brand-lilac bg-gradient-to-r from-white to-brand-mist/40 p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-magenta/40 hover:shadow-[0_10px_24px_-12px_rgba(227,28,121,0.35)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple text-[10px] font-bold text-white shadow-sm">
                        {a.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-ink">{a.name}</p>
                        <p className="truncate text-[11px] font-medium text-brand-ink/60">{a.leads} leads · {a.won} converted</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-brand-lilac sm:block">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple transition-all duration-1000 ease-out" style={{ width: `${a.rate}%` }} />
                        </div>
                        <span className="font-mono text-xs font-bold text-brand-magenta">{a.rate}%</span>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        a.status === 'Active' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="space-y-3">
          <SectionTitle eyebrow="Shortcuts" title="Quick Actions" hint="Jump straight to common tasks" />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Add Lead',           icon: Plus,        to: ROUTES.allLeads,  tone: 'magenta' },
              { label: 'Assign Leads',       icon: UserPlus,    to: ROUTES.assign,    tone: 'purple' },
              { label: 'Schedule Follow-up', icon: Calendar,    to: ROUTES.followUps, tone: 'emerald' },
              { label: "Today's Tasks",      icon: ListChecks,  to: ROUTES.tasks,     tone: 'amber' },
            ].map(({ label, icon: Icon, to, tone }, idx) => (
              <QuickAction key={label} label={label} icon={Icon} to={to} tone={tone} delay={idx * 40} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function SectionTitle({ eyebrow, title, hint }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple shadow-[0_0_12px_rgba(227,28,121,0.4)]" />
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-brand-magenta">{eyebrow}</p>
          <h2 className="font-display text-sm font-bold text-brand-ink">{title}</h2>
        </div>
      </div>
      {hint && <p className="text-[11px] font-medium text-brand-ink/50">{hint}</p>}
    </div>
  );
}

function Panel({ title, subtitle, action, icon: Icon, className = '', children }) {
  return (
    <div className={`group/panel relative min-w-0 overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/40 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)] backdrop-blur-sm transition-all duration-300 hover:border-brand-magenta/35 hover:shadow-[0_14px_36px_-16px_rgba(227,28,121,0.28)] ${className}`}>
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
}

function KPICard({ icon: Icon, label, value, color = 'purple', sub, to, alert, delay = 0 }) {
  const navigate = useNavigate();
  const themes = {
    purple:  { border: 'border-violet-200 hover:border-violet-400', bg: 'bg-violet-50', fg: 'text-brand-purple', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(139,47,214,0.55)]', bar: 'from-brand-purple to-brand-magenta', corner: 'bg-brand-purple/25' },
    emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'bg-emerald-50', fg: 'text-emerald-600', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(16,185,129,0.5)]', bar: 'from-emerald-500 to-emerald-400', corner: 'bg-emerald-400/25' },
    amber:   { border: 'border-amber-200 hover:border-amber-400', bg: 'bg-amber-50', fg: 'text-amber-600', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(245,158,11,0.5)]', bar: 'from-amber-500 to-orange-400', corner: 'bg-amber-400/25' },
    rose:    { border: 'border-rose-200 hover:border-rose-400', bg: 'bg-rose-50', fg: 'text-brand-magenta', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(227,28,121,0.55)]', bar: 'from-brand-magenta to-brand-purple', corner: 'bg-brand-magenta/25' },
  };
  const t = themes[color] || themes.purple;

  return (
    <button
      type="button"
      onClick={() => to && navigate(to)}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/40 p-4 text-left shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 ease-out ${t.border} ${t.glow} hover:-translate-y-1.5 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brand-magenta/40 animate-fade-slide-in`}
    >
      <span className={`absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100`} />
      <span className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${t.corner} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

      {alert && (
        <span className="pointer-events-none absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-magenta opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-magenta" />
        </span>
      )}

      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${t.border} ${t.bg} ${t.fg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
          <Icon size={16} />
        </span>
        <ChevronRight size={14} className="mt-1 -translate-x-2 text-brand-ink/30 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-brand-magenta group-hover:opacity-100" />
      </div>

      <div className="relative z-10 w-full">
        <p className="font-display text-2xl font-bold leading-tight text-brand-ink">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
        <p className="text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </button>
  );
}

function ProgressRow({ label, value, caption }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/60">{label}</span>
        <span className="font-display text-sm font-bold text-brand-magenta">{pct}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-brand-lilac">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        >
          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
      </div>
      {caption && <p className="mt-1.5 text-[11px] font-medium text-brand-ink/60">{caption}</p>}
    </div>
  );
}

function QuickAction({ label, icon: Icon, to, tone, delay = 0 }) {
  const navigate = useNavigate();
  const tones = {
    magenta: { from: 'from-brand-magenta', to: 'to-brand-purple', shadow: 'shadow-[0_6px_18px_-6px_rgba(227,28,121,0.6)]', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(227,28,121,0.6)]', border: 'hover:border-brand-magenta/60', ring: 'ring-rose-100' },
    purple:  { from: 'from-brand-purple', to: 'to-brand-magenta', shadow: 'shadow-[0_6px_18px_-6px_rgba(139,47,214,0.6)]', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(139,47,214,0.6)]', border: 'hover:border-brand-purple/60', ring: 'ring-violet-100' },
    amber:   { from: 'from-amber-500', to: 'to-orange-500', shadow: 'shadow-[0_6px_18px_-6px_rgba(245,158,11,0.6)]', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(245,158,11,0.6)]', border: 'hover:border-amber-400', ring: 'ring-amber-100' },
    emerald: { from: 'from-emerald-500', to: 'to-emerald-400', shadow: 'shadow-[0_6px_18px_-6px_rgba(16,185,129,0.6)]', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(16,185,129,0.6)]', border: 'hover:border-emerald-400', ring: 'ring-emerald-100' },
  };
  const t = tones[tone] || tones.magenta;

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/50 p-4 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)] transition-all duration-300 hover:-translate-y-1.5 ${t.border} ${t.glow} animate-fade-slide-in`}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-magenta/[0.08] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      <span className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.from} ${t.to} text-white ${t.shadow} ring-2 ${t.ring} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
        <Icon size={18} />
      </span>
      <span className="relative text-center text-xs font-semibold leading-tight text-brand-ink">{label}</span>
    </button>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-brand-magenta/30 bg-white px-3 py-2 shadow-[0_8px_24px_-8px_rgba(227,28,121,0.4)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-magenta">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5 font-display text-sm font-bold text-brand-ink">
          {p.value}
          {p.name && <span className="ml-1 text-xs font-normal text-brand-ink/60">{p.name}</span>}
        </p>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-brand-ink/50">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-magenta/15 to-brand-purple/10 ring-1 ring-brand-lilac">
        <CheckCircle2 size={18} className="text-brand-magenta" />
      </span>
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}