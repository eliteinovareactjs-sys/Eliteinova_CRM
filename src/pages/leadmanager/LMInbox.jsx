// src/pages/leadmanager/LMInbox.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, X, Inbox, Layers, Globe, Megaphone,
  Phone, Mail, Filter, CheckCircle2, AlertCircle, Building2, CalendarDays,
  Radio, Users, Clock, Zap, Eye, Pencil, Trash2, Grid3x3, List, UserCheck,
  UserPlus, Briefcase, Activity, MessageSquare, User, MapPin, Calendar,
  Sparkles, Target, ShieldAlert, Copy, Ban, ArrowRightCircle, Flag,
  CircleSlash, ShieldCheck, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { AGENTS, LEADS } from '../../data/mockData';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const norm = (v) => String(v ?? '').toLowerCase().replace(/[\s_-]+/g, '');
const isAssigned = (l) => !!l.assignedAgent && norm(l.assignedAgent) !== 'unassigned';

/* Inbox statuses map to a simplified flow before entering the main pipeline */
const INBOX_STATUSES = {
  new:         { label: 'New Enquiry',  tone: 'purple', icon: Sparkles,   desc: 'Freshly captured, needs review' },
  unprocessed: { label: 'Unprocessed',  tone: 'amber',  icon: Clock,      desc: 'Pending validation & assignment' },
  duplicate:   { label: 'Duplicate',    tone: 'rose',   icon: Copy,       desc: 'Possible match with existing lead' },
  invalid:     { label: 'Invalid',      tone: 'slate',  icon: Ban,        desc: 'Rejected — bad data or spam' },
};

const PRIORITIES = [
  { value: 'High',   label: 'High Priority',   tone: 'rose',    dot: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-600 border-rose-200' },
  { value: 'Medium', label: 'Medium Priority', tone: 'amber',   dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'Low',    label: 'Low Priority',    tone: 'emerald', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

const priorityMeta = (p) =>
  PRIORITIES.find((x) => norm(x.value) === norm(p)) || PRIORITIES[1];

const SOURCE_ICONS = {
  'Website':              Globe,
  'Landing Page':         Globe,
  'Google Ads':           Target,
  'Meta Ads':             Megaphone,
  'Facebook':             Megaphone,
  'Instagram':            Megaphone,
  'YouTube':              Megaphone,
  'WhatsApp':             MessageSquare,
  'LinkedIn':             Briefcase,
  'Referral':             Users,
  'Offline Campaign':     MapPin,
  'Event':                Calendar,
  'Promotional Campaign': Megaphone,
  'Manual Entry':         User,
  'Excel/CSV Import':     Layers,
};

const channelOf = (lead) => {
  const src = lead.leadSource || 'Manual Entry';
  return { icon: SOURCE_ICONS[src] || Globe, label: src };
};

/* Sidebar views for the Inbox */
const VIEWS = [
  { key: 'all',         label: 'All Enquiries',    icon: Inbox,          subtitle: 'Every new enquiry waiting to be triaged' },
  { key: 'new',         label: 'New Enquiries',    icon: Sparkles,       subtitle: 'Freshly captured leads needing review' },
  { key: 'unprocessed', label: 'Unprocessed',      icon: Clock,          subtitle: 'Leads awaiting validation and assignment' },
  { key: 'duplicate',   label: 'Duplicate Leads',  icon: Copy,           subtitle: 'Potential matches with existing pipeline leads' },
  { key: 'invalid',     label: 'Invalid Leads',    icon: Ban,            subtitle: 'Rejected leads — spam, bad data, or out of scope' },
];

const TONES = {
  purple:  'bg-violet-100 text-brand-purple ring-violet-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  amber:   'bg-amber-100 text-amber-700 ring-amber-200',
  rose:    'bg-rose-100 text-brand-magenta ring-rose-200',
  slate:   'bg-slate-100 text-slate-600 ring-slate-200',
};

const BAR_COLORS = {
  purple: 'from-brand-purple to-brand-magenta',
  rose: 'from-brand-magenta to-brand-purple',
  amber: 'from-amber-500 to-orange-400',
  emerald: 'from-emerald-500 to-emerald-400',
  slate: 'from-slate-400 to-slate-300',
};

/* Shared column template for list view */
const LIST_GRID =
  'grid items-center gap-4 grid-cols-[20px_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_120px_215px]';

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const leadPhone = (l) => l.phone ?? l.mobile ?? '';
const leadEmail = (l) => l.email ?? '';
const leadSource = (l) => l.leadSource || 'Unknown';
const leadCampaign = (l) => l.campaign || '';
const leadDate = (l) => l.createdAt ?? l.capturedAt ?? l.date ?? null;
const initials = (name) =>
  String(name || '?').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const toTime = (d) => {
  if (!d) return NaN;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? NaN : t;
};
const formatDate = (d) => {
  const t = toTime(d);
  return Number.isNaN(t)
    ? '—'
    : new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

/* Lock background page scroll while a drawer/modal is open */
function useLockBodyScroll() {
  useEffect(() => {
    const scrollY = window.scrollY;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.scrollTo(0, scrollY);
    };
  }, []);
}

/* Page numbers with ellipsis, e.g. [1, '…', 4, 5, 6, '…', 12] */
function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LMInbox({ view: initialView = 'all' }) {
  const { activeWebsiteId, activeWebsite } = useAuth();

  const agents = useMemo(
    () => (AGENTS || []).filter((a) => a.websiteId === activeWebsiteId),
    [activeWebsiteId]
  );

  // Inbox leads are just a filtered/derived view of the mock data for demonstration
  const [leads, setLeads] = useState(() =>
    (LEADS || []).filter((l) => l.websiteId === activeWebsiteId).map(l => ({
      ...l,
      inboxStatus: l.inboxStatus || 'new', // default state
      priority: l.priority || 'Medium',
      isDuplicate: l.isDuplicate || false,
    }))
  );
  const [activeView, setActiveView] = useState(initialView);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAgent, setBulkAgent] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  /* Reset on project/view change */
  useEffect(() => {
    setLeads((LEADS || []).filter((l) => l.websiteId === activeWebsiteId).map(l => ({
      ...l,
      inboxStatus: l.inboxStatus || 'new',
      priority: l.priority || 'Medium',
      isDuplicate: l.isDuplicate || false,
    })));
    setSelected(new Set());
    setPage(1);
  }, [activeWebsiteId]);

  useEffect(() => { setActiveView(initialView); }, [initialView]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [activeView, search, priorityFilter, sourceFilter, sortBy, pageSize]);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const currentView = VIEWS.find((v) => v.key === activeView) || VIEWS[0];
  const ViewIcon = currentView.icon;

  /* Counts for tabs */
  const viewCounts = useMemo(() => {
    const counts = {};
    VIEWS.forEach((v) => {
      if (v.key === 'all') counts[v.key] = leads.length;
      else counts[v.key] = leads.filter((l) => l.inboxStatus === v.key).length;
    });
    return counts;
  }, [leads]);

  /* Snapshot stats */
  const stats = useMemo(() => {
    const today = startOfToday();
    const week = today - 6 * 86400000;
    let todayCount = 0, weekCount = 0;
    leads.forEach((l) => {
      const t = toTime(leadDate(l));
      if (Number.isNaN(t)) return;
      if (t >= today) todayCount += 1;
      if (t >= week) weekCount += 1;
    });
    return {
      today: todayCount,
      week: weekCount,
      highPriority: leads.filter(l => l.priority === 'High').length,
      unprocessed: leads.filter(l => l.inboxStatus === 'unprocessed').length,
    };
  }, [leads]);

  const sources = useMemo(() => Array.from(new Set(leads.map(leadSource))).sort(), [leads]);

  /* Filtering */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = leads.filter((l) => {
      if (activeView !== 'all' && l.inboxStatus !== activeView) return false;
      if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
      if (sourceFilter !== 'all' && leadSource(l) !== sourceFilter) return false;
      if (!q) return true;
      return (
        String(l.name ?? '').toLowerCase().includes(q) ||
        String(leadPhone(l)).toLowerCase().includes(q) ||
        String(leadEmail(l)).toLowerCase().includes(q) ||
        String(leadCampaign(l)).toLowerCase().includes(q)
      );
    });

    const sorted = [...rows];
    if (sortBy === 'name') sorted.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    else if (sortBy === 'source') sorted.sort((a, b) => leadSource(a).localeCompare(leadSource(b)));
    else {
      const hasDates = sorted.some((l) => !Number.isNaN(toTime(leadDate(l))));
      if (hasDates) sorted.sort((a, b) => (toTime(leadDate(b)) || 0) - (toTime(leadDate(a)) || 0));
      else sorted.reverse();
    }
    return sorted;
  }, [leads, activeView, search, priorityFilter, sourceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(safePage * pageSize, filtered.length);
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((l) => selected.has(l.id));

  /* ========== ACTIONS ========== */
  const updateLead = useCallback((id, patch) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const handleStatusChange = (lead, newStatus) => {
    if (lead.inboxStatus === newStatus) return;
    updateLead(lead.id, { inboxStatus: newStatus });
    showToast(`${lead.name} moved to ${INBOX_STATUSES[newStatus].label}`);
  };

  const handlePriorityChange = (lead, newPriority) => {
    if (lead.priority === newPriority) return;
    updateLead(lead.id, { priority: newPriority });
    showToast(`${lead.name} set to ${newPriority} priority`);
  };

  const handleAgentChange = (lead, value) => {
    updateLead(lead.id, { assignedAgent: value || 'Unassigned' });
    showToast(value ? `${lead.name} assigned to ${value}` : `${lead.name} unassigned`);
  };

  const handleMoveToPipeline = (lead) => {
    // In a real app this would push to the LMLeads pipeline; here we just mark as unprocessed/moved
    updateLead(lead.id, { inboxStatus: 'unprocessed', assignedAgent: lead.assignedAgent || 'Unassigned' });
    showToast(`${lead.name} moved to active pipeline`, 'success');
  };

  const handleMarkDuplicate = (lead) => {
    updateLead(lead.id, { inboxStatus: 'duplicate', isDuplicate: true });
    showToast(`${lead.name} flagged as duplicate`, 'error');
  };

  const handleReject = (lead) => {
    updateLead(lead.id, { inboxStatus: 'invalid' });
    showToast(`${lead.name} rejected`, 'error');
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
    setLeads((prev) => prev.map((l) => (selected.has(l.id) ? { ...l, assignedAgent: bulkAgent, inboxStatus: 'unprocessed' } : l)));
    showToast(`${selected.size} lead${selected.size > 1 ? 's' : ''} assigned and moved to pipeline`);
    setSelected(new Set());
    setBulkAgent('');
  };

  const handleBulkReject = () => {
    if (selected.size === 0) return;
    setLeads((prev) => prev.map((l) => (selected.has(l.id) ? { ...l, inboxStatus: 'invalid' } : l)));
    showToast(`${selected.size} lead${selected.size > 1 ? 's' : ''} rejected`, 'error');
    setSelected(new Set());
  };

  const handleEditLead = (id, updates) => {
    updateLead(id, updates);
    setEditingLead(null);
    showToast('Lead updated successfully');
  };

  /* Triage action from inside the Edit modal (form edits are saved too) */
  const handleModalAction = (lead, kind, data) => {
    const statusByKind = { route: 'unprocessed', duplicate: 'duplicate', reject: 'invalid' };
    const patch = { ...data, inboxStatus: statusByKind[kind] };
    if (kind === 'duplicate') patch.isDuplicate = true;
    updateLead(lead.id, patch);
    setEditingLead(null);
    const messages = {
      route: `${lead.name} moved to active pipeline`,
      duplicate: `${lead.name} flagged as duplicate`,
      reject: `${lead.name} rejected`,
    };
    showToast(messages[kind], kind === 'route' ? 'success' : 'error');
  };

  const handleDeleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setConfirmDelete(null);
    showToast('Lead deleted', 'error');
  };

  const clearFilters = () => { setSearch(''); setPriorityFilter('all'); setSourceFilter('all'); };
  const filtersActive = search || priorityFilter !== 'all' || sourceFilter !== 'all';

  const viewingLead = viewingId ? leads.find((l) => l.id === viewingId) : null;

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
            <h1 className="font-display text-xl font-semibold text-brand-ink">Lead Inbox</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <Inbox size={13} className="text-brand-magenta" />
              {activeView === 'all' ? 'Process new enquiries before they enter the active pipeline' : currentView.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeWebsite?.name && (
              <div className="flex items-center gap-2 rounded-full border border-brand-magenta/25 bg-gradient-to-r from-brand-magenta/[0.12] to-brand-purple/[0.10] px-4 py-2 text-xs font-semibold text-brand-purple shadow-sm">
                <Building2 size={14} /> {activeWebsite.name}
              </div>
            )}
          </div>
        </div>

        {/* SNAPSHOT */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Inbox Snapshot</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">
                {leads.length} enquiries waiting for triage
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <StatCard icon={Inbox}       label="Total Enquiries"  value={leads.length}            color="purple" />
            <StatCard icon={Sparkles}    label="Captured Today"   value={stats.today}             color="emerald" />
            <StatCard icon={Flag}        label="High Priority"    value={stats.highPriority}      color="rose" />
            <StatCard icon={Clock}       label="Unprocessed"      value={stats.unprocessed}       color="amber" />
            <StatCard icon={ArrowRightCircle} label="Ready to Route" value={leads.filter(l => l.inboxStatus === 'new').length} color="emerald" />
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

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-full border p-1.5 transition-all ${viewMode === 'grid' ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'border-brand-lilac text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="Grid view"
              ><Grid3x3 size={14} /></button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-full border p-1.5 transition-all ${viewMode === 'list' ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'border-brand-lilac text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="List view"
              ><List size={14} /></button>
            </div>
          </div>
        </div>

        {/* TABLE / GRID PANEL */}
        <Panel
          title={activeView === 'all' ? 'Inbox Leads' : currentView.label}
          subtitle={`${filtered.length} lead${filtered.length === 1 ? '' : 's'} waiting`}
          icon={ViewIcon}
        >
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email or campaign"
                className="w-full rounded-full border border-brand-lilac bg-white py-2 pl-9 pr-3 text-xs text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20"
              />
            </div>

            <SelectBox icon={Flag} value={priorityFilter} onChange={setPriorityFilter} label="Priority">
              <option value="all">All priorities</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </SelectBox>

            <SelectBox icon={Filter} value={sourceFilter} onChange={setSourceFilter} label="Source">
              <option value="all">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectBox>

            <SelectBox value={sortBy} onChange={setSortBy} label="Sort">
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="source">Source</option>
            </SelectBox>

            <SelectBox icon={List} value={String(pageSize)} onChange={(v) => setPageSize(Number(v))} label="Rows per page">
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
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
                <UserPlus size={12} /> Assign & Route
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
              >
                <Ban size={12} /> Reject
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

          {/* Content */}
          {filtered.length === 0 ? (
            <EmptyState message={filtersActive ? 'No enquiries match your filters' : `No ${currentView.label.toLowerCase()} yet`} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageRows.map((l) => (
                <LeadCard
                  key={l.id}
                  lead={l}
                  onView={() => setViewingId(l.id)}
                  onEdit={() => setEditingLead(l)}
                  onDelete={() => setConfirmDelete(l)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-brand-lilac/70 bg-white">
              <div className={`${LIST_GRID} border-b border-brand-lilac/70 bg-gradient-to-r from-brand-mist/70 to-transparent px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50`}>
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Select all leads on this page"
                  className="h-4 w-4 accent-[#E31C79]"
                />
                <span>Lead</span>
                <span>Contact</span>
                <span>Source</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {pageRows.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  selected={selected}
                  onToggle={toggleRow}
                  onView={() => setViewingId(l.id)}
                  onEdit={() => setEditingLead(l)}
                  onDelete={() => setConfirmDelete(l)}
                />
              ))}
            </div>
          )}

                    {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-lilac bg-white px-4 py-3 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)]">
              <p className="text-xs text-brand-ink/60">
                Showing <span className="font-bold text-brand-ink">{startIdx + 1}–{endIdx}</span> of{' '}
                <span className="font-bold text-brand-magenta">{filtered.length}</span> enquiries
              </p>

              {totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center gap-1">
                  <button type="button" onClick={() => setPage(1)} disabled={safePage === 1} aria-label="First page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-lilac bg-white text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronsLeft size={14} />
                  </button>
                  <button type="button" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Previous page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-lilac bg-white text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>

                  {getPageNumbers(safePage, totalPages).map((p, i) =>
                    p === '…' ? (
                      <span key={`dots-${i}`} className="px-1.5 text-xs font-bold text-brand-ink/40">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-current={p === safePage ? 'page' : undefined}
                        className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition-all ${
                          p === safePage
                            ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)]'
                            : 'border border-brand-lilac bg-white text-brand-ink/70 hover:border-brand-magenta/40 hover:text-brand-magenta'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button type="button" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} aria-label="Next page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-lilac bg-white text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight size={14} />
                  </button>
                  <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} aria-label="Last page"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-lilac bg-white text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:text-brand-magenta disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronsRight size={14} />
                  </button>
                </nav>
              )}
            </div>
          )}
        </Panel>

        {/* MODALS & DRAWERS */}
        {editingLead && (
          <EditLeadModal
            lead={editingLead}
            agents={agents}
            sources={sources}
            onClose={() => setEditingLead(null)}
            onSubmit={(data) => handleEditLead(editingLead.id, data)}
            onAction={(kind, data) => handleModalAction(editingLead, kind, data)}
          />
        )}

        {viewingLead && (
          <LeadDetailDrawer
            lead={viewingLead}
            onClose={() => setViewingId(null)}
            onEdit={() => { setEditingLead(viewingLead); setViewingId(null); }}
            onStatusChange={(s) => handleStatusChange(viewingLead, s)}
            onPriorityChange={(p) => handlePriorityChange(viewingLead, p)}
            onMoveToPipeline={() => { handleMoveToPipeline(viewingLead); setViewingId(null); }}
            onMarkDuplicate={() => { handleMarkDuplicate(viewingLead); setViewingId(null); }}
            onReject={() => { handleReject(viewingLead); setViewingId(null); }}
          />
        )}

        {confirmDelete && (
          <ConfirmDialog
            title={`Delete "${confirmDelete.name}"?`}
            message="This will permanently delete this lead. This action cannot be undone."
            confirmLabel="Delete Lead"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDeleteLead(confirmDelete.id)}
          />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEAD CARD (GRID)
   ═══════════════════════════════════════════════════════════════ */
function LeadCard({ lead: l, onView, onEdit, onDelete }) {
  const meta = INBOX_STATUSES[l.inboxStatus] || INBOX_STATUSES.new;
  const ch = channelOf(l);
  const ChIcon = ch.icon;

  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-brand-lilac/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-magenta/50 hover:shadow-[0_20px_45px_-15px_rgba(227,28,121,0.25)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-2xl bg-gradient-to-r from-brand-magenta to-brand-purple transition-transform duration-500 group-hover:scale-x-100" />

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {initials(l.name)}
          </div>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onView} className="block w-full truncate text-left font-display text-base font-semibold text-brand-ink hover:text-brand-magenta">
              {l.name || 'Unnamed lead'}
            </button>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${TONES[meta.tone]}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-brand-mist/80 to-brand-mist/40 p-3 text-xs">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Phone size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Phone</span>
            <span className="truncate text-right font-semibold text-brand-ink">{leadPhone(l) || '—'}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Mail size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Email</span>
            <span className="truncate text-right font-semibold text-brand-ink" title={leadEmail(l)}>{leadEmail(l) || '—'}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <ChIcon size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Source</span>
            <span className="truncate text-right font-semibold text-brand-ink">{leadSource(l)}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Megaphone size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Campaign</span>
            <span className="truncate text-right font-semibold text-brand-ink">{leadCampaign(l) || '—'}</span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-brand-lilac/60 bg-brand-mist/40 px-3 py-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/50">Captured</p>
          <p className="truncate font-display text-sm font-bold text-brand-ink">{formatDate(leadDate(l))}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={onView} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white px-2 py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="View details">
            <Eye size={12} className="shrink-0" /> <span className="truncate">View</span>
          </button>
          <button type="button" onClick={onEdit} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-2 py-2 text-xs font-semibold text-white shadow-card transition-all hover:brightness-110" title="Edit lead">
            <Pencil size={12} className="shrink-0" /> <span className="truncate">Edit</span>
          </button>
          <button type="button" onClick={onDelete} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-100" title="Delete lead">
            <Trash2 size={12} className="shrink-0" /> <span className="truncate">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEAD ROW (LIST)
   ═══════════════════════════════════════════════════════════════ */
function LeadRow({ lead: l, selected, onToggle, onView, onEdit, onDelete }) {
  const meta = INBOX_STATUSES[l.inboxStatus] || INBOX_STATUSES.new;
  const ch = channelOf(l);
  const ChIcon = ch.icon;
  const isSelected = selected.has(l.id);

  return (
    <div className={`${LIST_GRID} border-b border-brand-lilac/50 px-4 py-3 text-xs transition-colors last:border-b-0 hover:bg-brand-mist/50 ${isSelected ? 'bg-brand-magenta/[0.04]' : ''}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(l.id)}
        aria-label={`Select ${l.name}`}
        className="h-4 w-4 accent-[#E31C79]"
      />

      {/* Lead */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-[11px] font-bold text-white shadow-sm">
          {initials(l.name)}
        </span>
        <div className="min-w-0">
          <button type="button" onClick={onView} className="block max-w-full truncate text-left text-sm font-semibold text-brand-ink hover:text-brand-magenta">
            {l.name || 'Unnamed lead'}
          </button>
        </div>
      </div>

      {/* Contact */}
      <div className="min-w-0">
        <p className="truncate font-medium text-brand-ink/80">{leadPhone(l) || '—'}</p>
        {leadEmail(l) && <p className="truncate text-[11px] text-brand-ink/50">{leadEmail(l)}</p>}
      </div>

      {/* Source */}
      <div className="flex min-w-0 items-center gap-1.5 text-brand-ink/70">
        <ChIcon size={12} className="shrink-0 text-brand-magenta" />
        <span className="truncate font-medium">{leadSource(l)}</span>
      </div>

      {/* Status */}
      <div>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${TONES[meta.tone]}`}>
          {meta.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" onClick={onView} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-lilac bg-white px-2.5 text-[11px] font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="View details">
          <Eye size={12} /> View
        </button>
        <button type="button" onClick={onEdit} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-magenta to-brand-purple px-2.5 text-[11px] font-semibold text-white shadow-card transition-all hover:brightness-110" title="Edit lead">
          <Pencil size={12} /> Edit
        </button>
        <button type="button" onClick={onDelete} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-500 transition-all hover:bg-rose-100" title="Delete lead">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EDIT LEAD MODAL
   ═══════════════════════════════════════════════════════════════ */
function EditSection({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
          <Icon size={12} />
        </span>
        <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function EditLeadModal({ lead, agents, sources, onClose, onSubmit, onAction }) {
  useLockBodyScroll();

  const [form, setForm] = useState({
    name: lead.name || '',
    phone: leadPhone(lead),
    email: leadEmail(lead),
    source: lead.leadSource || '',
    assignedAgent: isAssigned(lead) ? lead.assignedAgent : '',
    campaign: lead.campaign || '',
    project: lead.project || '',
    city: lead.city || '',
    priority: lead.priority || 'Medium',
    notes: lead.notes || '',
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.phone.trim() && !form.email.trim()) return 'Add a phone number or an email';
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address';
    return null;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    leadSource: form.source.trim() || 'Manual Entry',
    assignedAgent: form.assignedAgent || 'Unassigned',
    campaign: form.campaign.trim(),
    project: form.project.trim(),
    city: form.city.trim(),
    priority: form.priority,
    notes: form.notes.trim(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    onSubmit(buildPayload());
  };

  /* Triage actions save the form edits together with the action */
  const runAction = (kind) => {
    const err = validate();
    if (err) return setError(err);
    onAction?.(kind, buildPayload());
  };

  const inputCls = 'w-full rounded-xl border border-brand-lilac bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20';
  const labelCls = 'mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit lead">
      <div className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-white via-white to-brand-mist/40 shadow-[0_24px_60px_-20px_rgba(139,47,214,0.45)]"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-magenta to-brand-purple" />
        <div className="flex items-center justify-between border-b border-brand-lilac/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-[0_4px_12px_-4px_rgba(227,28,121,0.5)]">
              <Pencil size={15} />
            </span>
            <h2 className="font-display text-[15px] font-bold text-brand-ink">Edit Lead</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-brand-ink/50 hover:bg-brand-lilac/50 hover:text-brand-magenta">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto overscroll-contain p-6">
          <EditSection icon={User} title="Contact Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Name *</span>
                <input value={form.name} onChange={set('name')} placeholder="Full name" className={inputCls} autoFocus />
              </label>
              <label className="block">
                <span className={labelCls}>Phone</span>
                <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} inputMode="tel" />
              </label>
              <label className="block">
                <span className={labelCls}>Email</span>
                <input value={form.email} onChange={set('email')} placeholder="name@email.com" className={inputCls} type="email" />
              </label>
              <label className="block">
                <span className={labelCls}>City</span>
                <input value={form.city} onChange={set('city')} placeholder="e.g. Chennai" className={inputCls} />
              </label>
            </div>
          </EditSection>

          <EditSection icon={Target} title="Source & Campaign">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Source</span>
                <input value={form.source} onChange={set('source')} list="lm-inbox-sources-edit" placeholder="e.g. Google Ads" className={inputCls} />
                <datalist id="lm-inbox-sources-edit">
                  {Array.from(new Set([...Object.keys(SOURCE_ICONS), ...sources])).map((s) => <option key={s} value={s} />)}
                </datalist>
              </label>
              <label className="block">
                <span className={labelCls}>Campaign</span>
                <input value={form.campaign} onChange={set('campaign')} placeholder="e.g. Diwali Offer" className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Project</span>
                <input value={form.project} onChange={set('project')} placeholder="Project name" className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Assign to Agent</span>
                <select value={form.assignedAgent} onChange={set('assignedAgent')} className={inputCls}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </label>
            </div>
          </EditSection>

          <EditSection icon={Flag} title="Priority">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Priority</span>
                <select value={form.priority} onChange={set('priority')} className={inputCls}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
            </div>
          </EditSection>

          <EditSection icon={MessageSquare} title="Notes">
            <textarea value={form.notes} onChange={set('notes')} placeholder="Add any context..." rows={3} className={`${inputCls} resize-none`} />
          </EditSection>

          <EditSection icon={Activity} title="Triage & Route">
            <p className="mb-3 text-[11px] text-brand-ink/50">
              Your edits above are saved together with the action you choose.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => runAction('route')} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600">
                <ArrowRightCircle size={13} /> Route to Pipeline
              </button>
              <button type="button" onClick={() => runAction('duplicate')} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600">
                <Copy size={13} /> Mark Duplicate
              </button>
              <button type="button" onClick={() => runAction('reject')} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600">
                <Ban size={13} /> Reject Lead
              </button>
            </div>
          </EditSection>

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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEAD DETAIL DRAWER
   ═══════════════════════════════════════════════════════════════ */
function LeadDetailDrawer({ lead: l, onClose, onEdit, onStatusChange, onPriorityChange, onMoveToPipeline, onMarkDuplicate, onReject }) {
  const meta = INBOX_STATUSES[l.inboxStatus] || INBOX_STATUSES.new;
  const prio = priorityMeta(l.priority);
  const ch = channelOf(l);

  useLockBodyScroll();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Lead details" className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl animate-slide-in-right overflow-y-auto overscroll-contain bg-white shadow-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-lilac bg-gradient-to-r from-brand-mist/60 to-white px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-sm font-bold text-white shadow-sm">
              {initials(l.name)}
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">{l.id}</p>
              <h3 className="font-display text-base font-bold text-brand-ink">{l.name}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${TONES[meta.tone]}`}>
              {meta.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${prio.chip}`}>
              <Flag size={12} /> {prio.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lilac/60 px-3 py-1.5 text-xs font-bold text-brand-purple">
              <ch.icon size={12} /> {leadSource(l)}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-brand-mist/60 to-white p-5">
            <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-magenta/10 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-magenta to-brand-purple text-xl font-bold text-white shadow-md">
                {initials(l.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-brand-ink">{l.name}</p>
                <p className="font-mono text-[11px] text-brand-ink/50">{l.id}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-ink/70">
                  {leadPhone(l) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={11} className="text-brand-magenta" /> {leadPhone(l)}
                    </span>
                  )}
                  {leadEmail(l) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={11} className="text-brand-magenta" /> {leadEmail(l)}
                    </span>
                  )}
                  {l.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={11} className="text-brand-magenta" /> {l.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card !p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                <Briefcase size={12} />
              </span>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Lead Information</h4>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoRow icon={Globe}     label="Source"      value={leadSource(l)} />
              <InfoRow icon={Megaphone} label="Campaign"    value={leadCampaign(l) || '—'} />
              <InfoRow icon={Briefcase} label="Project"     value={l.project || '—'} />
              <InfoRow icon={UserPlus}  label="Assigned To" value={isAssigned(l) ? l.assignedAgent : 'Unassigned'} />
              <InfoRow icon={Calendar}  label="Captured"    value={formatDate(leadDate(l))} />
              <InfoRow icon={Flag}      label="Priority"    value={prio.label} />
            </div>
          </div>

          {l.notes && (
            <div className="card !p-5">
              <div className="flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                  <MessageSquare size={12} />
                </span>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Notes</h4>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl border border-brand-lilac/60 bg-brand-mist/40 p-3 text-sm text-brand-ink/80">
                {l.notes}
              </p>
            </div>
          )}

          {/* Triage Actions */}
          <div className="card !p-5">
            <div className="flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                <Activity size={12} />
              </span>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Triage & Route</h4>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={onMoveToPipeline} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">
                <ArrowRightCircle size={12} /> Route to Pipeline
              </button>
              <button onClick={onMarkDuplicate} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600">
                <Copy size={12} /> Mark Duplicate
              </button>
              <button onClick={onReject} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600">
                <Ban size={12} /> Reject Lead
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onEdit} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-xs font-semibold text-white shadow-card hover:brightness-110">
              <Pencil size={13} /> Edit Lead
            </button>
            <button type="button" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white py-2.5 text-xs font-semibold text-brand-ink hover:bg-brand-lilac/40">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-lilac/50 text-brand-magenta">
        <Icon size={14} />
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="shrink-0 text-brand-ink/50">{label}</span>
        <span className="truncate font-semibold text-brand-ink">{value}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════ */
function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  useLockBodyScroll();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
            <AlertCircle size={18} />
          </div>
          <h3 className="font-display text-base font-semibold text-brand-ink">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-brand-ink/60">{message}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600">
            {confirmLabel}
          </button>
        </div>
      </div>
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
      <p className="max-w-sm text-sm text-brand-ink/50">New enquiries will appear here as they are captured.</p>
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