// src/pages/leadmanager/LMLeads.jsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Users, Search, Plus, Download, ChevronLeft, ChevronRight, X, Inbox,
  Layers, Sparkles, UserCheck, Phone, Flame, Calendar, Target, Award,
  XCircle, ThumbsDown, Lock, CheckCircle2, AlertCircle, Mail, Filter,
  UserPlus, Building2, Grid3x3, List, Eye, Pencil, Trash2, Globe,
  Megaphone, MapPin, Briefcase, Activity, MessageSquare, User,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { AGENTS, LEADS } from '../../data/mockData';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE_OPTIONS = [10, 25, 50];

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

/* Shared column template so the header and every row line up */
const LIST_GRID =
  'grid items-center gap-4 grid-cols-[20px_minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_100px_215px]';

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const leadPhone = (l) => l.phone ?? l.mobile ?? '';
const leadEmail = (l) => l.email ?? '';
const leadSource = (l) => l.leadSource || l.source || 'Unknown';
const initials = (name) =>
  String(name || '?').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
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
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAgent, setBulkAgent] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  /* Reset when project or the routed view changes */
  useEffect(() => {
    setLeads((LEADS || []).filter((l) => l.websiteId === activeWebsiteId));
    setSelected(new Set());
    setPage(1);
  }, [activeWebsiteId]);

  useEffect(() => { setActiveView(initialView); }, [initialView]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [activeView, search, sourceFilter, agentFilter, sortBy, pageSize]);
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

  const handleStatusChange = (lead, value) => {
    if (lead.status === value) return;
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
      campaign: form.campaign || '',
      project: form.project || '',
      city: form.city || '',
      priority: form.priority || 'Medium',
      notes: form.notes || '',
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    setShowAdd(false);
    showToast('Lead added successfully');
  };

  const handleEditLead = (id, updates) => {
    updateLead(id, updates);
    setEditingLead(null);
    showToast('Lead updated successfully');
  };

  const handleDeleteLead = (id) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setConfirmDelete(null);
    showToast('Lead deleted', 'error');
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

        {/* VIEW TABS & TOGGLE */}
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
                onClick={() => setViewMode('grid')}
                className={`rounded-full border p-1.5 transition-all ${viewMode === 'grid' ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'border-brand-lilac text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="Grid view"
              ><Grid3x3 size={14} /></button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-full border p-1.5 transition-all ${viewMode === 'list' ? 'border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'border-brand-lilac text-brand-ink/50 hover:bg-brand-lilac/30'}`}
                title="List view"
              ><List size={14} /></button>
            </div>
          </div>
        </div>

        {/* TABLE / GRID PANEL */}
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

          {/* Content */}
          {filtered.length === 0 ? (
            <EmptyState message={filtersActive ? 'No leads match your filters' : `No ${currentView.label.toLowerCase()} yet`} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageRows.map((l) => (
                <LeadCard
                  key={l.id}
                  lead={l}
                  onView={() => setViewingLead(l)}
                  onEdit={() => setEditingLead(l)}
                  onDelete={() => setConfirmDelete(l)}
                  onStatusChange={handleStatusChange}
                  onAgentChange={handleAgentChange}
                  agents={agents}
                />
              ))}
            </div>
          ) : (
                        <div className="overflow-hidden rounded-xl border border-brand-lilac/70 bg-white">
              {/* Header */}
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

              {/* Rows */}
              {pageRows.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  onView={() => setViewingLead(l)}
                  onEdit={() => setEditingLead(l)}
                  onDelete={() => setConfirmDelete(l)}
                  selected={selected}
                  onToggle={toggleRow}
                />
              ))}
            </div>
          )}

                    {/* Pagination */}
          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-lilac bg-white px-4 py-3 shadow-[0_4px_16px_-8px_rgba(139,47,214,0.15)]">
              <p className="text-xs text-brand-ink/60">
                Showing <span className="font-bold text-brand-ink">{startIdx + 1}–{endIdx}</span> of{' '}
                <span className="font-bold text-brand-magenta">{filtered.length}</span> leads
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
        {showAdd && (
          <AddLeadModal
            agents={agents}
            sources={sources}
            onClose={() => setShowAdd(false)}
            onSubmit={handleAddLead}
          />
        )}

        {editingLead && (
          <EditLeadModal
            lead={editingLead}
            agents={agents}
            sources={sources}
            onClose={() => setEditingLead(null)}
            onSubmit={(data) => handleEditLead(editingLead.id, data)}
          />
        )}

        {viewingLead && (
          <LeadDetailDrawer
            lead={viewingLead}
            onClose={() => setViewingLead(null)}
            onEdit={() => { setEditingLead(viewingLead); setViewingLead(null); }}
            onStatusChange={(s) => handleStatusChange(viewingLead, s)}
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
function LeadCard({ lead: l, onView, onEdit, onDelete, onStatusChange, onAgentChange, agents }) {
  const meta = statusMeta(l.status);
  const SourceIcon = Globe; // Simplified for now, can map if needed

  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-brand-lilac/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-magenta/50 hover:shadow-[0_20px_45px_-15px_rgba(227,28,121,0.25)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-2xl bg-gradient-to-r from-brand-magenta to-brand-purple transition-transform duration-500 group-hover:scale-x-100" />
      
      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {initials(l.name)}
          </div>
          <div className="min-w-0 flex-1">
            <button onClick={onView} className="block w-full truncate text-left font-display text-base font-semibold text-brand-ink hover:text-brand-magenta">
              {l.name}
            </button>
            <p className="truncate text-[11px] font-mono text-brand-ink/50">{l.id}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${TONES[meta.tone]}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-brand-mist/80 to-brand-mist/40 p-3 text-xs">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Phone size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Phone</span>
            <span className="truncate text-right font-semibold text-brand-ink">{leadPhone(l)}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Mail size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Email</span>
            <span className="truncate text-right font-semibold text-brand-ink" title={leadEmail(l)}>{leadEmail(l) || '—'}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Globe size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Source</span>
            <span className="truncate text-right font-semibold text-brand-ink">{leadSource(l)}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Megaphone size={11} className="shrink-0 text-brand-ink/50" />
            <span className="truncate text-brand-ink/50">Campaign</span>
            <span className="truncate text-right font-semibold text-brand-ink">{l.campaign || '—'}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 items-center gap-2 rounded-xl border border-brand-lilac/60 bg-brand-mist/40 px-3 py-2">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/50">Created</p>
            <p className="truncate font-display text-sm font-bold text-brand-ink">{formatDate(l.createdAt)}</p>
          </div>
          <div className="flex justify-end">
            <select
              value={isAssigned(l) ? l.assignedAgent : ''}
              onChange={(e) => onAgentChange(l, e.target.value)}
              className={`max-w-[120px] rounded-full border px-2 py-1 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-brand-magenta/30 ${isAssigned(l) ? 'border-brand-lilac bg-white text-brand-ink' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={onView} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white px-2 py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="View details">
            <Eye size={12} className="shrink-0" /> <span className="truncate">View</span>
          </button>
          <button onClick={onEdit} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-2 py-2 text-xs font-semibold text-white shadow-card transition-all hover:brightness-110" title="Edit lead">
            <Pencil size={12} className="shrink-0" /> <span className="truncate">Edit</span>
          </button>
          <button onClick={onDelete} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-500 transition-all hover:bg-rose-100" title="Delete lead">
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
function LeadRow({ lead: l, onView, onEdit, onDelete, selected, onToggle }) {
  const meta = statusMeta(l.status);
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
            {l.name}
          </button>
          <p className="truncate font-mono text-[10px] text-brand-ink/50">{l.id}</p>
        </div>
      </div>

      {/* Contact */}
      <div className="min-w-0">
        <p className="truncate font-medium text-brand-ink/80">{leadPhone(l) || '—'}</p>
        {leadEmail(l) && <p className="truncate text-[11px] text-brand-ink/50">{leadEmail(l)}</p>}
      </div>

      {/* Source */}
      <p className="truncate font-medium text-brand-ink/70">{leadSource(l)}</p>

      {/* Status */}
      <div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${TONES[meta.tone]}`}>
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
   ADD LEAD MODAL
   ═══════════════════════════════════════════════════════════════ */
function AddLeadModal({ agents, sources, onClose, onSubmit }) {
  useLockBodyScroll();
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: '', agent: '', campaign: '', project: '', city: '', priority: 'Medium', notes: '' });
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

        <div className="max-h-[70vh] overflow-y-auto space-y-3 p-5">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
             <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Campaign</span>
              <input value={form.campaign} onChange={set('campaign')} placeholder="e.g. Summer Sale" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">City</span>
              <input value={form.city} onChange={set('city')} placeholder="e.g. Mumbai" className={inputCls} />
            </label>
          </div>
           <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Notes</span>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Add any context..." rows={2} className={inputCls} />
            </label>

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
   EDIT LEAD MODAL (Full Detail Editing)
   ═══════════════════════════════════════════════════════════════ */
function EditLeadModal({ lead, agents, sources, onClose, onSubmit }) {
  useLockBodyScroll();
  const [form, setForm] = useState({
    name: lead.name || '',
    phone: lead.phone || lead.mobile || '',
    email: lead.email || '',
    source: lead.leadSource || lead.source || '',
    assignedAgent: lead.assignedAgent || '',
    campaign: lead.campaign || '',
    project: lead.project || '',
    city: lead.city || '',
    priority: lead.priority || 'Medium',
    status: lead.status || 'Fresh',
    notes: lead.notes || '',
  });
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
    if (form.phone && form.phone.replace(/\D/g, '').length < 7) return setError('Enter a valid phone number');
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address');
    
    // Map back to canonical keys used in the table
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      leadSource: form.source,
      assignedAgent: form.assignedAgent,
      campaign: form.campaign,
      project: form.project,
      city: form.city,
      priority: form.priority,
      status: form.status,
      notes: form.notes,
    });
  };

  const inputCls = 'w-full rounded-xl border border-brand-lilac bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-ink/40 focus:border-brand-magenta/50 focus:outline-none focus:ring-2 focus:ring-brand-magenta/20';

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

        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Section: Contact Info */}
          <div>
             <div className="mb-3 flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                  <User size={12} />
                </span>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Contact Information</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Name *</span>
                  <input value={form.name} onChange={set('name')} placeholder="Full name" className={inputCls} autoFocus />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Phone</span>
                  <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className={inputCls} inputMode="tel" />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Email</span>
                  <input value={form.email} onChange={set('email')} placeholder="name@email.com" className={inputCls} type="email" />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">City</span>
                  <input value={form.city} onChange={set('city')} placeholder="e.g. Mumbai" className={inputCls} />
                </label>
              </div>
          </div>

          {/* Section: Campaign Info */}
          <div>
             <div className="mb-3 flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                  <Target size={12} />
                </span>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Source & Campaign</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Source</span>
                  <input value={form.source} onChange={set('source')} list="lm-lead-sources-edit" placeholder="e.g. Google Ads" className={inputCls} />
                  <datalist id="lm-lead-sources-edit">
                    {sources.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Campaign</span>
                  <input value={form.campaign} onChange={set('campaign')} placeholder="e.g. Summer Sale" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Project</span>
                  <input value={form.project} onChange={set('project')} placeholder="e.g. Eliteinova CRM" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Assign to Agent</span>
                  <select value={form.assignedAgent} onChange={set('assignedAgent')} className={inputCls}>
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </label>
              </div>
          </div>

          {/* Section: Status & Priority */}
          <div>
             <div className="mb-3 flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                  <Sparkles size={12} />
                </span>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Status & Priority</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Status</span>
                  <select value={form.status} onChange={set('status')} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">Priority</span>
                  <select value={form.priority} onChange={set('priority')} className={inputCls}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>
          </div>

          {/* Section: Notes */}
          <div>
             <div className="mb-3 flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                  <MessageSquare size={12} />
                </span>
                <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Notes</h4>
              </div>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Add any context..." rows={3} className={inputCls} />
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
function LeadDetailDrawer({ lead: l, onClose, onEdit, onStatusChange }) {
  const meta = statusMeta(l.status);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Lock background page scroll while the drawer is open */
  useEffect(() => {
    const scrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label="Lead details" className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto overscroll-contain bg-white shadow-panel animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-lilac bg-gradient-to-r from-brand-mist/60 to-white px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-sm text-sm font-bold">
               {initials(l.name)}
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">{l.id}</p>
              <h3 className="font-display text-base font-bold text-brand-ink">{l.name}</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${TONES[meta.tone]}`}>
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lilac/60 px-3 py-1.5 text-xs font-bold text-brand-purple">
              <Globe size={12} /> {leadSource(l)}
            </span>
            {l.campaign && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-mist px-3 py-1.5 text-xs font-bold text-brand-ink/70">
                <Megaphone size={12} /> {l.campaign}
              </span>
            )}
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
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={11} className="text-brand-magenta" /> {leadPhone(l)}
                  </span>
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
              <InfoRow icon={Megaphone} label="Campaign"    value={l.campaign || '—'} />
              <InfoRow icon={Briefcase} label="Project"     value={l.project || '—'} />
              <InfoRow icon={UserPlus}  label="Assigned To" value={isAssigned(l) ? l.assignedAgent : 'Unassigned'} />
              <InfoRow icon={Calendar}  label="Created"     value={formatDate(l.createdAt)} />
              <InfoRow icon={Sparkles}  label="Status"      value={meta.label} />
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

          <div className="card !p-5">
            <div className="flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">
                <Activity size={12} />
              </span>
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Change Status</h4>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const active = norm(l.status) === norm(s.value);
                return (
                  <button
                    key={s.value}
                    onClick={() => { if (!active) onStatusChange(s.value); }}
                    disabled={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? `${TONES[s.tone]} ring-2 ring-brand-magenta/20 cursor-default`
                        : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onEdit} className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-xs font-semibold text-white shadow-card hover:brightness-110">
              <Pencil size={13} /> Edit Lead
            </button>
            <button onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white py-2.5 text-xs font-semibold text-brand-ink hover:bg-brand-lilac/40">
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
          <button onClick={onCancel} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600">
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