// src/pages/leadmanager/LMLeads.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Users, Search, Plus, Download, ChevronLeft, ChevronRight, X, Inbox,
  Layers, Sparkles, UserCheck, Phone, Flame, Calendar, Target, Award,
  XCircle, ThumbsDown, Lock, CheckCircle2, AlertCircle, Mail, Filter,
  UserPlus, Building2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { AGENTS, LEADS } from '../../data/mockData';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

const norm = (v) => String(v ?? '').toLowerCase().replace(/[\s_-]+/g, '');
const isAssigned = (l) => !!l.assignedAgent && norm(l.assignedAgent) !== 'unassigned';

/* Canonical status list (value stored on the lead) */
const STATUS_OPTIONS = [
  { value: 'Fresh',          label: 'New',            aliases: ['fresh', 'new'],                                     tone: 'purple' },
  { value: 'Contacted',      label: 'Contacted',      aliases: ['contacted'],                                        tone: 'purple' },
  { value: 'Interested',     label: 'Interested',     aliases: ['interested', 'hot'],                                tone: 'rose' },
  { value: 'Follow-up',      label: 'Follow-up',      aliases: ['followup', 'followups', 'callback'],                tone: 'amber' },
  { value: 'Qualified',      label: 'Qualified',      aliases: ['qualified'],                                        tone: 'emerald' },
  { value: 'Won',            label: 'Converted',      aliases: ['won', 'converted'],                                 tone: 'emerald' },
  { value: 'Not Interested', label: 'Not Interested', aliases: ['notinterested'],                                    tone: 'rose' },
  { value: 'Lost',           label: 'Lost',           aliases: ['lost', 'dead', 'closedlost'],                       tone: 'slate' },
  { value: 'Closed',         label: 'Closed',         aliases: ['closed'],                                           tone: 'slate' },
];

const statusMeta = (status) =>
  STATUS_OPTIONS.find((s) => s.aliases.includes(norm(status))) || {
    value: status || 'Unknown', label: status || 'Unknown', aliases: [], tone: 'slate',
  };

const hasStatus = (lead, key) => {
  const meta = STATUS_OPTIONS.find((s) => s.value === key);
  return !!meta && meta.aliases.includes(norm(lead.status));
};

/* Sidebar views → filter */
const VIEWS = [
  { key: 'all',            label: 'All Leads',        icon: Layers,     subtitle: 'Manage all leads in the pipeline',            test: () => true },
  { key: 'new',            label: 'New Leads',        icon: Sparkles,   subtitle: 'Newly received leads waiting for processing', test: (l) => hasStatus(l, 'Fresh') },
  { key: 'unassigned',     label: 'Unassigned Leads', icon: Users,      subtitle: 'Leads waiting for agent assignment',          test: (l) => !isAssigned(l) },
  { key: 'assigned',       label: 'Assigned Leads',   icon: UserCheck,  subtitle: 'Leads currently assigned to agents',          test: (l) => isAssigned(l) },
  { key: 'contacted',      label: 'Contacted Leads',  icon: Phone,      subtitle: 'Leads that have been contacted',              test: (l) => hasStatus(l, 'Contacted') },
  { key: 'interested',     label: 'Interested Leads', icon: Flame,      subtitle: 'Leads showing interest',                      test: (l) => hasStatus(l, 'Interested') },
  { key: 'followup',       label: 'Follow-up Leads',  icon: Calendar,   subtitle: 'Leads requiring further interaction',         test: (l) => hasStatus(l, 'Follow-up') },
  { key: 'qualified',      label: 'Qualified Leads',  icon: Target,     subtitle: "Leads that meet the project's criteria",      test: (l) => hasStatus(l, 'Qualified') },
  { key: 'converted',      label: 'Converted Leads',  icon: Award,      subtitle: 'Successfully converted leads',                test: (l) => hasStatus(l, 'Won') },
  { key: 'notinterested',  label: 'Not Interested',   icon: ThumbsDown, subtitle: 'Leads that declined the offer',               test: (l) => hasStatus(l, 'Not Interested') },
  { key: 'lost',           label: 'Lost Leads',       icon: XCircle,    subtitle: 'Leads that are no longer active',             test: (l) => hasStatus(l, 'Lost') },
  { key: 'closed',         label: 'Closed Leads',     icon: Lock,       subtitle: 'Leads whose handling is closed',              test: (l) => hasStatus(l, 'Closed') },
];

const TONES = {
  purple:  'bg-violet-100 text-brand-purple ring-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  amber:   'bg-amber-100 text-amber-700 ring-amber-200',
  rose:    'bg-rose-100 text-brand-magenta ring-rose-200',
  slate:   'bg-slate-100 text-slate-600 ring-slate-200',
};

const CSV_COLUMNS = ['Name', 'Phone', 'Email', 'Source', 'Status', 'Agent'];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const leadPhone = (l) => l.phone ?? l.mobile ?? '';
const leadEmail = (l) => l.email ?? '';
const leadSource = (l) => l.leadSource || 'Unknown';
const initials = (name) =>
  String(name || '?').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   `view` can be passed per route (e.g. <LMLeads view="unassigned" />);
   the tabs below also let the user switch views in place.
   ═══════════════════════════════════════════════════════════════ */
export default function LMLeads({ view: initialView = 'all' }) {
  const { activeWebsiteId, activeWebsite } = useAuth();

  const agents = useMemo(
    () => (AGENTS || []).filter((a) => a.websiteId === activeWebsiteId),
    [activeWebsiteId]
  );

  const [leads, setLeads] = useState(() =>
    (LEADS || []).filter((l) => l.websiteId === activeWebsiteId)
  );
  const [activeView, setActiveView] = useState(initialView);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAgent, setBulkAgent] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  /* Reset when project or the routed view changes */
  useEffect(() => {
    setLeads((LEADS || []).filter((l) => l.websiteId === activeWebsiteId));
    setSelected(new Set());
    setPage(1);
  }, [activeWebsiteId]);

  useEffect(() => { setActiveView(initialView); }, [initialView]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [activeView, search, sourceFilter, agentFilter, sortBy]);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const currentView = VIEWS.find((v) => v.key === activeView) || VIEWS[0];
  const ViewIcon = currentView.icon;

  const viewCounts = useMemo(() => {
    const counts = {};
    VIEWS.forEach((v) => { counts[v.key] = leads.filter(v.test).length; });
    return counts;
  }, [leads]);

  const sources = useMemo(
    () => Array.from(new Set(leads.map(leadSource))).sort(),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (!currentView.test(l)) return false;
      if (sourceFilter !== 'all' && leadSource(l) !== sourceFilter) return false;
      if (agentFilter === 'unassigned' && isAssigned(l)) return false;
      if (agentFilter !== 'all' && agentFilter !== 'unassigned' && l.assignedAgent !== agentFilter) return false;
      if (!q) return true;
      return (
        String(l.name ?? '').toLowerCase().includes(q) ||
        String(leadPhone(l)).toLowerCase().includes(q) ||
        String(leadEmail(l)).toLowerCase().includes(q)
      );
    });

    const sorted = [...rows];
    if (sortBy === 'name') sorted.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    else if (sortBy === 'status') sorted.sort((a, b) => statusMeta(a.status).label.localeCompare(statusMeta(b.status).label));
    else sorted.reverse(); /* newest first: latest records are last in the list */
    return sorted;
  }, [leads, currentView, search, sourceFilter, agentFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((l) => selected.has(l.id));

  /* ========== ACTIONS ========== */
  const updateLead = useCallback((id, patch) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const handleStatusChange = (lead, value) => {
    updateLead(lead.id, { status: value });
    showToast(`${lead.name} marked as ${statusMeta(value).label}`);
  };

  const handleAgentChange = (lead, value) => {
    updateLead(lead.id, { assignedAgent: value || 'Unassigned' });
    showToast(value ? `${lead.name} assigned to ${value}` : `${lead.name} unassigned`);
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((l) => next.delete(l.id));
      else pageRows.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const handleBulkAssign = () => {
    if (!bulkAgent || selected.size === 0) return;
    setLeads((prev) => prev.map((l) => (selected.has(l.id) ? { ...l, assignedAgent: bulkAgent } : l)));
    showToast(`${selected.size} lead${selected.size > 1 ? 's' : ''} assigned to ${bulkAgent}`);
    setSelected(new Set());
    setBulkAgent('');
  };

  const handleAddLead = (form) => {
    const newLead = {
      id: `lead-${Date.now()}`,
      websiteId: activeWebsiteId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      leadSource: form.source || 'Manual Entry',
      status: 'Fresh',
      assignedAgent: form.agent || 'Unassigned',
    };
    setLeads((prev) => [...prev, newLead]);
    setShowAdd(false);
    showToast('Lead added successfully');
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast('No leads to export', 'error');
      return;
    }
    const rows = filtered.map((l) => [
      l.name, leadPhone(l), leadEmail(l), leadSource(l),
      statusMeta(l.status).label, isAssigned(l) ? l.assignedAgent : 'Unassigned',
    ]);
    const csv = [CSV_COLUMNS, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentView.key}-leads-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('Leads exported');
  };

  const clearFilters = () => {
    setSearch(''); setSourceFilter('all'); setAgentFilter('all');
  };
  const filtersActive = search || sourceFilter !== 'all' || agentFilter !== 'all';

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
            <h1 className="font-display text-xl font-semibold text-brand-ink">{currentView.label}</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <ViewIcon size={13} className="text-brand-magenta" />
              {currentView.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeWebsite?.name && (
              <div className="flex items-center gap-2 rounded-full border border-brand-magenta/25 bg-gradient-to-r from-brand-magenta/[0.12] to-brand-purple/[0.10] px-4 py-2 text-xs font-semibold text-brand-purple shadow-sm">
                <Building2 size={14} /> {activeWebsite.name}
              </div>
            )}
            {/* <button
              type="button"
              onClick={handleExport}
              className="group inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-magenta/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-magenta/40"
            >
              <Download size={14} className="transition-transform group-hover:translate-y-0.5" /> Export
            </button> */}
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(227,28,121,0.6)] focus:outline-none focus:ring-2 focus:ring-brand-magenta/40"
            >
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>

        {/* SNAPSHOT */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Lead Snapshot</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">
                {filtered.length} of {leads.length} leads shown
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard icon={Layers}    label="Total Leads" value={leads.length}            color="purple" />
            <StatCard icon={Sparkles}  label="New"         value={viewCounts.new}          color="purple" />
            <StatCard icon={Users}     label="Unassigned"  value={viewCounts.unassigned}   color="amber" />
            <StatCard icon={Target}    label="Qualified"   value={viewCounts.qualified}    color="emerald" />
            <StatCard icon={Award}     label="Converted"   value={viewCounts.converted}    color="emerald" />
          </div>
        </div>

        {/* VIEW TABS */}
        <div className="card !p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const active = activeView === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveView(v.key)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] scale-[1.02]'
                      : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'
                  }`}
                >
                  <Icon size={13} />
                  {v.label}
                  <span className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-brand-lilac/60 text-brand-ink/60'}`}>
                    {viewCounts[v.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLE PANEL */}
        <Panel
          title={currentView.label}
          subtitle={`${filtered.length} lead${filtered.length === 1 ? '' : 's'}`}
          icon={ViewIcon}
        >
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or email"
                className="w-full rounded-full border border-brand-lilac bg-white py-2 pl-9 pr-3 text-xs text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20"
              />
            </div>

            <SelectBox icon={Filter} value={sourceFilter} onChange={setSourceFilter} label="Source">
              <option value="all">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectBox>

            <SelectBox icon={UserCheck} value={agentFilter} onChange={setAgentFilter} label="Agent">
              <option value="all">All agents</option>
              <option value="unassigned">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </SelectBox>

            <SelectBox value={sortBy} onChange={setSortBy} label="Sort">
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="status">Status</option>
            </SelectBox>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-brand-magenta hover:bg-brand-magenta/10"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-magenta/30 bg-gradient-to-r from-brand-magenta/[0.08] to-brand-purple/[0.06] px-4 py-2.5">
              <span className="text-xs font-bold text-brand-ink">{selected.size} selected</span>
              <select
                value={bulkAgent}
                onChange={(e) => setBulkAgent(e.target.value)}
                aria-label="Assign selected leads to agent"
                className="rounded-full border border-brand-lilac bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-magenta/30"
              >
                <option value="">Assign to agent…</option>
                {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={!bulkAgent}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UserPlus size={12} /> Assign
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs font-semibold text-brand-ink/60 hover:text-brand-magenta"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Table */}
          {pageRows.length === 0 ? (
            <EmptyState message={filtersActive ? 'No leads match your filters' : `No ${currentView.label.toLowerCase()} yet`} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-lilac/70">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="bg-gradient-to-r from-brand-mist/70 to-transparent">
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleAllOnPage}
                        aria-label="Select all leads on this page"
                        className="h-3.5 w-3.5 accent-[#E31C79]"
                      />
                    </th>
                    <th className="px-3 py-3">Lead</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Assigned Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l) => {
                    const meta = statusMeta(l.status);
                    return (
                      <tr
                        key={l.id}
                        className={`border-t border-brand-lilac/50 transition-colors hover:bg-brand-mist/50 ${selected.has(l.id) ? 'bg-brand-magenta/[0.04]' : ''}`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(l.id)}
                            onChange={() => toggleRow(l.id)}
                            aria-label={`Select ${l.name}`}
                            className="h-3.5 w-3.5 accent-[#E31C79]"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple text-[10px] font-bold text-white shadow-sm">
                              {initials(l.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-brand-ink">{l.name || 'Unnamed lead'}</p>
                              {l.category && <p className="truncate font-mono text-[10px] text-brand-ink/50">{l.category}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {leadPhone(l) && (
                            <p className="flex items-center gap-1.5 font-medium text-brand-ink/80">
                              <Phone size={11} className="text-brand-purple" /> {leadPhone(l)}
                            </p>
                          )}
                          {leadEmail(l) && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-brand-ink/60">
                              <Mail size={11} className="text-brand-magenta" /> <span className="truncate">{leadEmail(l)}</span>
                            </p>
                          )}
                          {!leadPhone(l) && !leadEmail(l) && <span className="text-brand-ink/30">—</span>}
                        </td>
                        <td className="px-3 py-3 font-medium text-brand-ink/70">{leadSource(l)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${TONES[meta.tone]}`}>
                              {meta.label}
                            </span>
                            <select
                              value=""
                              onChange={(e) => e.target.value && handleStatusChange(l, e.target.value)}
                              aria-label={`Change status for ${l.name}`}
                              className="w-6 cursor-pointer rounded-md border border-brand-lilac bg-white py-1 text-[10px] text-brand-ink/60 focus:outline-none focus:ring-2 focus:ring-brand-magenta/30"
                              title="Change status"
                            >
                              <option value="">⋯</option>
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={isAssigned(l) ? l.assignedAgent : ''}
                            onChange={(e) => handleAgentChange(l, e.target.value)}
                            aria-label={`Assign agent for ${l.name}`}
                            className={`max-w-[160px] rounded-full border px-3 py-1.5 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 ${
                              isAssigned(l)
                                ? 'border-brand-lilac bg-white text-brand-ink'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}
                          >
                            <option value="">Unassigned</option>
                            {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="rounded-full border border-brand-lilac bg-white p-2 text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-xs font-bold text-brand-ink">{safePage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="rounded-full border border-brand-lilac bg-white p-2 text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Panel>

        {showAdd && (
          <AddLeadModal
            agents={agents}
            sources={sources}
            onClose={() => setShowAdd(false)}
            onSubmit={handleAddLead}
          />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADD LEAD MODAL
   ═══════════════════════════════════════════════════════════════ */
function AddLeadModal({ agents, sources, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: '', agent: '' });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    if (!form.phone.trim() && !form.email.trim()) return setError('Add a phone number or an email');
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 7) return setError('Enter a valid phone number');
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address');
    onSubmit(form);
  };

  const inputCls = 'w-full rounded-xl border border-brand-lilac bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Add lead">
      <div className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/40 shadow-[0_24px_60px_-20px_rgba(139,47,214,0.45)]"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-magenta to-brand-purple" />
        <div className="flex items-center justify-between border-b border-brand-lilac/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-[0_4px_12px_-4px_rgba(227,28,121,0.5)]">
              <Plus size={15} />
            </span>
            <h2 className="font-display text-[15px] font-bold text-brand-ink">Add Lead</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-brand-ink/50 hover:bg-brand-lilac/50 hover:text-brand-magenta">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Name *</span>
            <input value={form.name} onChange={set('name')} placeholder="Full name" className={inputCls} autoFocus />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Phone</span>
              <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} inputMode="tel" />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Email</span>
              <input value={form.email} onChange={set('email')} placeholder="name@email.com" className={inputCls} type="email" />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Source</span>
              <input value={form.source} onChange={set('source')} list="lm-lead-sources" placeholder="e.g. Google Ads" className={inputCls} />
              <datalist id="lm-lead-sources">
                {sources.map((s) => <option key={s} value={s} />)}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Assign to</span>
              <select value={form.agent} onChange={set('agent')} className={inputCls}>
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <AlertCircle size={13} /> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-lilac/70 bg-brand-mist/40 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink/70 hover:border-brand-magenta/40">
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple px-5 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] hover:-translate-y-0.5">
            Add Lead
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEAF COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
const STAT_THEMES = {
  purple:  { border: 'border-violet-200 hover:border-violet-400', bg: 'bg-violet-50', fg: 'text-brand-purple', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(139,47,214,0.55)]', bar: 'from-brand-purple to-brand-magenta' },
  emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'bg-emerald-50', fg: 'text-emerald-600', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(16,185,129,0.5)]', bar: 'from-emerald-500 to-emerald-400' },
  amber:   { border: 'border-amber-200 hover:border-amber-400', bg: 'bg-amber-50', fg: 'text-amber-600', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(245,158,11,0.5)]', bar: 'from-amber-500 to-orange-400' },
  rose:    { border: 'border-rose-200 hover:border-rose-400', bg: 'bg-rose-50', fg: 'text-brand-magenta', glow: 'hover:shadow-[0_16px_36px_-14px_rgba(227,28,121,0.55)]', bar: 'from-brand-magenta to-brand-purple' },
};

const StatCard = memo(function StatCard({ icon: Icon, label, value, color = 'purple' }) {
  const t = STAT_THEMES[color] || STAT_THEMES.purple;
  return (
    <div className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/40 p-4 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 hover:-translate-y-1.5 animate-fade-slide-in ${t.border} ${t.glow}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100`} />
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${t.border} ${t.bg} ${t.fg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
        <Icon size={16} />
      </span>
      <div>
        <p className="font-display text-2xl font-bold leading-tight tabular-nums text-brand-ink">{(value || 0).toLocaleString('en-IN')}</p>
        <p className="text-xs font-semibold text-brand-ink/75">{label}</p>
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

const SelectBox = memo(function SelectBox({ icon: Icon, value, onChange, label, children }) {
  return (
    <div className="relative">
      {Icon && <Icon size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-magenta" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`max-w-[190px] rounded-full border border-brand-lilac bg-white py-2 pr-7 text-xs font-semibold text-brand-ink hover:bg-brand-lilac/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20 ${Icon ? 'pl-8' : 'pl-3'}`}
      >
        {children}
      </select>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lilac text-brand-magenta">
        <Inbox size={22} />
      </span>
      <p className="font-display text-base font-semibold text-brand-ink">{message}</p>
      <p className="max-w-sm text-sm text-brand-ink/50">Leads will appear here as they match this view.</p>
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