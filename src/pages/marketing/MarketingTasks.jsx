// src/pages/marketing/MarketingTasks.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, Filter, ChevronDown, Eye, Pencil,
  Trash2, AlertCircle, CheckCircle2, XCircle, X, CheckSquare,
  Sparkles, Clock, Zap, Target, Calendar, Briefcase, Flame,
  Inbox, Download, Grid3x3, List, Activity, Star, Megaphone,
  Send, Users, Flag, PlayCircle, RotateCcw,
  CalendarDays, TrendingUp, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const TASK_TABS = [
  { key: 'all', label: 'All Tasks', icon: CheckSquare },
  { key: 'today', label: "Today's Tasks", icon: Clock },
  { key: 'upcoming', label: 'Upcoming', icon: CalendarDays },
  { key: 'overdue', label: 'Overdue', icon: AlertCircle },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];

const STATUS_STYLES = {
  'Pending': { chip: 'bg-blue-100 text-blue-600 border-blue-200', icon: Clock },
  'In Progress': { chip: 'bg-violet-100 text-brand-purple border-violet-200', icon: PlayCircle },
  'Completed': { chip: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  'Overdue': { chip: 'bg-rose-100 text-brand-magenta border-rose-200', icon: AlertCircle },
  'Cancelled': { chip: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

const PRIORITY_STYLES = {
  'High': { chip: 'bg-rose-100 text-brand-magenta border-rose-200', icon: Flame },
  'Medium': { chip: 'bg-amber-100 text-amber-600 border-amber-200', icon: Zap },
  'Low': { chip: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: Star },
};

const TASK_CATEGORIES = [
  'Campaign Setup', 'Ad Monitoring', 'Lead Review', 'Lead Validation',
  'Social Media Posting', 'Customer Communication', 'Campaign Reporting',
  'Lead Handover', 'Performance Review',
];

const CATEGORY_ICONS = {
  'Campaign Setup': Megaphone,
  'Ad Monitoring': Activity,
  'Lead Review': Eye,
  'Lead Validation': CheckCircle2,
  'Social Media Posting': Send,
  'Customer Communication': Users,
  'Campaign Reporting': BarChart3,
  'Lead Handover': Target,
  'Performance Review': TrendingUp,
};

const ASSIGNEES = ['Ravi Sharma', 'Anita Desai', 'Kiran Rao', 'Priya Menon', 'Self'];

const STORAGE_KEY = 'tasks:marketing';

/* ─── Date Helpers ─── */
const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysISO = (days) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (val) => {
  const d = parseLocalDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatShortDate = (val) => {
  const d = parseLocalDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const relativeDue = (due) => {
  if (!due) return '—';
  const d = parseLocalDate(due);
  const today = parseLocalDate(todayISO());
  if (!d || !today) return '—';
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
};

/* ─── Task Helpers ─── */
const getEffectiveStatus = (task) => {
  if (!task) return 'Pending';
  if (task.status === 'Completed' || task.status === 'Cancelled') return task.status;
  if (task.due && task.due < todayISO()) return 'Overdue';
  if (task.status === 'Overdue' && task.due && task.due >= todayISO()) return 'Pending';
  return task.status || 'Pending';
};

const normalizeTask = (task) => ({
  ...task,
  id: String(task.id || ''),
  title: String(task.title || ''),
  category: TASK_CATEGORIES.includes(task.category) ? task.category : 'Campaign Setup',
  due: task.due || '',
  priority: ['High', 'Medium', 'Low'].includes(task.priority) ? task.priority : 'Medium',
  status: TASK_STATUSES.includes(task.status) ? task.status : 'Pending',
  assignee: task.assignee || 'Self',
  project: task.project || '',
  notes: task.notes || '',
  createdAt: task.createdAt || todayISO(),
  updatedAt: task.updatedAt || todayISO(),
  history: Array.isArray(task.history) ? task.history : [],
});

const loadState = (storageKey, fallback) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeTask);
    }
  } catch {
    // Use fallback data if stored data is unavailable or invalid.
  }
  return fallback.map(normalizeTask);
};

const saveState = (storageKey, value) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage may be unavailable or full.
  }
};

/* ═══════════════════════════════════════════════════════════════
   SEED DATA
   ═══════════════════════════════════════════════════════════════ */
const SEED_TASKS = [
  { id: 'T-2001', title: 'Review Google Ads Leads', category: 'Lead Review', due: todayISO(), priority: 'High', status: 'Pending', assignee: 'Self', project: 'Eliteinova Matrimony', notes: 'Verify 25 new leads from morning campaign.', createdAt: addDaysISO(-1), updatedAt: todayISO(), history: [{ at: addDaysISO(-1), action: 'Created', by: 'System' }] },
  { id: 'T-2002', title: 'Validate Facebook Leads', category: 'Lead Validation', due: todayISO(), priority: 'Medium', status: 'In Progress', assignee: 'Self', project: 'Eliteinova CRM', notes: 'Cross-check mobile numbers and emails.', createdAt: addDaysISO(-2), updatedAt: todayISO(), history: [{ at: addDaysISO(-2), action: 'Created', by: 'System' }, { at: todayISO(), action: 'Started', by: 'Marketing Exec' }] },
  { id: 'T-2003', title: 'Handover Qualified Leads', category: 'Lead Handover', due: addDaysISO(1), priority: 'High', status: 'Pending', assignee: 'Ravi Sharma', project: 'Eliteinova Matrimony', notes: 'Submit approved leads to sales manager.', createdAt: todayISO(), updatedAt: todayISO(), history: [{ at: todayISO(), action: 'Created', by: 'System' }] },
  { id: 'T-2004', title: 'Update Campaign Budget', category: 'Campaign Setup', due: addDaysISO(-1), priority: 'Low', status: 'Overdue', assignee: 'Self', project: 'Eliteinova CRM', notes: 'Reallocate budget to top-performing ad sets.', createdAt: addDaysISO(-5), updatedAt: addDaysISO(-1), history: [{ at: addDaysISO(-5), action: 'Created', by: 'System' }] },
  { id: 'T-2005', title: 'Social Media Posting', category: 'Social Media Posting', due: todayISO(), priority: 'Medium', status: 'Completed', assignee: 'Anita Desai', project: 'Eliteinova Matrimony', notes: 'Instagram + Facebook reel for weekend offer.', createdAt: todayISO(), updatedAt: todayISO(), history: [{ at: todayISO(), action: 'Created', by: 'System' }, { at: todayISO(), action: 'Completed', by: 'Anita Desai' }] },
  { id: 'T-2006', title: 'Prepare Weekly Campaign Report', category: 'Campaign Reporting', due: addDaysISO(2), priority: 'Medium', status: 'Pending', assignee: 'Self', project: 'Eliteinova CRM', notes: 'Include ROI and CPL metrics.', createdAt: todayISO(), updatedAt: todayISO(), history: [{ at: todayISO(), action: 'Created', by: 'System' }] },
  { id: 'T-2007', title: 'Call Back Warm Leads', category: 'Customer Communication', due: addDaysISO(3), priority: 'High', status: 'Pending', assignee: 'Priya Menon', project: 'Eliteinova Matrimony', notes: 'Follow up with 12 interested prospects.', createdAt: todayISO(), updatedAt: todayISO(), history: [{ at: todayISO(), action: 'Created', by: 'System' }] },
  { id: 'T-2008', title: 'Monitor Meta Ad Performance', category: 'Ad Monitoring', due: addDaysISO(-2), priority: 'Medium', status: 'Overdue', assignee: 'Self', project: 'Eliteinova CRM', notes: 'Check CTR and frequency thresholds.', createdAt: addDaysISO(-4), updatedAt: addDaysISO(-2), history: [{ at: addDaysISO(-4), action: 'Created', by: 'System' }] },
  { id: 'T-2009', title: 'Performance Review — Q2', category: 'Performance Review', due: addDaysISO(5), priority: 'Low', status: 'Pending', assignee: 'Kiran Rao', project: 'Eliteinova CRM', notes: 'Review team KPIs and lead quality scores.', createdAt: todayISO(), updatedAt: todayISO(), history: [{ at: todayISO(), action: 'Created', by: 'System' }] },
  { id: 'T-2010', title: 'Campaign Setup — New Offer', category: 'Campaign Setup', due: addDaysISO(4), priority: 'High', status: 'In Progress', assignee: 'Self', project: 'Eliteinova Matrimony', notes: 'Landing page + Google Ads campaign structure.', createdAt: addDaysISO(-1), updatedAt: todayISO(), history: [{ at: addDaysISO(-1), action: 'Created', by: 'System' }, { at: todayISO(), action: 'Started', by: 'Marketing Exec' }] },
  { id: 'T-2011', title: 'Social Media Content Calendar', category: 'Social Media Posting', due: addDaysISO(-3), priority: 'Low', status: 'Completed', assignee: 'Anita Desai', project: 'Eliteinova Matrimony', notes: 'Scheduled posts for next 2 weeks.', createdAt: addDaysISO(-6), updatedAt: addDaysISO(-3), history: [{ at: addDaysISO(-6), action: 'Created', by: 'System' }, { at: addDaysISO(-3), action: 'Completed', by: 'Anita Desai' }] },
  { id: 'T-2012', title: 'Invalid Lead Cleanup', category: 'Lead Validation', due: addDaysISO(-4), priority: 'Medium', status: 'Cancelled', assignee: 'Self', project: 'Eliteinova CRM', notes: 'Cancelled — duplicate of another task.', createdAt: addDaysISO(-7), updatedAt: addDaysISO(-4), history: [{ at: addDaysISO(-7), action: 'Created', by: 'System' }, { at: addDaysISO(-4), action: 'Cancelled', by: 'Marketing Exec' }] },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingTasks() {
  const { user, activeWebsiteId } = useAuth();
  const websiteKey = activeWebsiteId || 'default';
  return <MarketingTasksContent key={websiteKey} storageKey={`${STORAGE_KEY}:${websiteKey}`} user={user} />;
}

function MarketingTasksContent({ storageKey, user }) {
  const [tasks, setTasks] = useState(() => loadState(storageKey, SEED_TASKS));
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const toastTimerRef = useRef(null);
  const editingIdRef = useRef(null);
  const viewingIdRef = useRef(null);

  useEffect(() => { saveState(storageKey, tasks); }, [storageKey, tasks]);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    if (editingIdRef.current) {
      const fresh = tasks.find((t) => t.id === editingIdRef.current);
      if (fresh) setEditing(fresh);
    }
    if (viewingIdRef.current) {
      const fresh = tasks.find((t) => t.id === viewingIdRef.current);
      if (fresh) setViewing(fresh);
    }
  }, [tasks]);

  const tabFiltered = useMemo(() => {
    let list = [...tasks];
    const today = todayISO();

    if (activeTab === 'today') {
      list = list.filter((t) => t.due === today && !['Completed', 'Cancelled'].includes(t.status));
    } else if (activeTab === 'upcoming') {
      list = list.filter((t) => t.due && t.due > today && !['Completed', 'Cancelled'].includes(t.status));
    } else if (activeTab === 'overdue') {
      list = list.filter((t) => getEffectiveStatus(t) === 'Overdue');
    } else if (activeTab === 'completed') {
      list = list.filter((t) => t.status === 'Completed');
    }

    if (statusFilter !== 'All') list = list.filter((t) => getEffectiveStatus(t) === statusFilter);
    if (priorityFilter !== 'All') list = list.filter((t) => t.priority === priorityFilter);
    if (categoryFilter !== 'All') list = list.filter((t) => t.category === categoryFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => `${t.title} ${t.id} ${t.category} ${t.project} ${t.assignee} ${t.notes}`.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      const dateA = a.due || '9999-12-31';
      const dateB = b.due || '9999-12-31';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  }, [tasks, activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const summary = useMemo(() => {
    const statuses = tasks.map(getEffectiveStatus);
    return {
      total: tasks.length,
      pending: statuses.filter((s) => s === 'Pending').length,
      inProgress: statuses.filter((s) => s === 'In Progress').length,
      completed: statuses.filter((s) => s === 'Completed').length,
      overdue: statuses.filter((s) => s === 'Overdue').length,
    };
  }, [tasks]);

  const tabCounts = useMemo(() => {
    const today = todayISO();
    return {
      all: tasks.length,
      today: tasks.filter((t) => t.due === today && !['Completed', 'Cancelled'].includes(t.status)).length,
      upcoming: tasks.filter((t) => t.due && t.due > today && !['Completed', 'Cancelled'].includes(t.status)).length,
      overdue: tasks.filter((t) => getEffectiveStatus(t) === 'Overdue').length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
    };
  }, [tasks]);

  const nextTaskId = useCallback((existing) => {
    const maxNum = existing.reduce((m, t) => {
      const n = parseInt(String(t.id).replace(/^T-/, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 2000);
    return `T-${maxNum + 1}`;
  }, []);

  const handleCreate = useCallback((data) => {
    const now = todayISO();
    setTasks((prev) => {
      const newTask = {
        ...data,
        id: nextTaskId(prev),
        status: data.status || 'Pending',
        createdAt: now,
        updatedAt: now,
        history: [{ at: now, action: 'Created', by: user?.name || 'Marketing Exec' }],
      };
      return [newTask, ...prev];
    });
    setShowModal(false);
    setEditing(null);
    editingIdRef.current = null;
    showToast(`Task "${data.title}" added`);
  }, [nextTaskId, showToast, user]);

  const handleEdit = useCallback((id, updates) => {
    const now = todayISO();
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const changed = { ...t, ...updates, updatedAt: now };
      if (updates.status && updates.status !== t.status) {
        changed.history = [...(t.history || []), { at: now, action: `Status → ${updates.status}`, by: user?.name || 'Marketing Exec' }];
      }
      return changed;
    }));
    setEditing(null);
    setShowModal(false);
    editingIdRef.current = null;
    showToast('Task updated');
  }, [showToast, user]);

  const handleDelete = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmDelete(null);
    if (editingIdRef.current === id) { setEditing(null); editingIdRef.current = null; }
    if (viewingIdRef.current === id) { setViewing(null); viewingIdRef.current = null; }
    showToast('Task deleted', 'error');
  }, [showToast]);

  const handleStatusChange = useCallback((id, newStatus) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id || t.status === newStatus) return t;
      const now = todayISO();
      return {
        ...t,
        status: newStatus,
        updatedAt: now,
        history: [...(t.history || []), { at: now, action: `Status → ${newStatus}`, by: user?.name || 'Marketing Exec' }],
      };
    }));
    showToast(`Status → ${newStatus}`);
  }, [showToast, user]);

  const handleComplete = useCallback((id) => handleStatusChange(id, 'Completed'), [handleStatusChange]);
  const handleStart = useCallback((id) => handleStatusChange(id, 'In Progress'), [handleStatusChange]);
  const handleReopen = useCallback((id) => handleStatusChange(id, 'Pending'), [handleStatusChange]);

  const handleExport = useCallback(() => {
    if (tabFiltered.length === 0) {
      showToast('No tasks to export', 'error');
      return;
    }

    const rows = [
      ['ID', 'Title', 'Category', 'Due', 'Priority', 'Status', 'Assignee', 'Project', 'Notes'],
      ...tabFiltered.map((t) => [
        t.id, t.title, t.category, t.due || '', t.priority, getEffectiveStatus(t), t.assignee || '', t.project || '', t.notes || '',
      ]),
    ];

    const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + rows.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-tasks-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${tabFiltered.length} tasks`);
  }, [tabFiltered, showToast]);

  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setStatusOpen(false);
    setPriorityOpen(false);
    setCategoryOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    editingIdRef.current = null;
    setShowModal(true);
  }, []);

  const openEdit = useCallback((task) => {
    setEditing(task);
    editingIdRef.current = task.id;
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditing(null);
    editingIdRef.current = null;
  }, []);

  const openView = useCallback((task) => {
    setViewing(task);
    viewingIdRef.current = task.id;
  }, []);

  const closeView = useCallback(() => {
    setViewing(null);
    viewingIdRef.current = null;
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FDF8FE] via-white to-[#FBF3FF]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-magenta/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-brand-purple/[0.05] blur-3xl" />

      <div className="relative space-y-5 px-1 py-1 pb-40">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-brand-ink">Marketing Tasks</h1>
            <p className="flex items-center gap-1.5 text-sm text-brand-ink/50">
              <CheckSquare size={13} className="text-brand-magenta" />
              Organize daily marketing activities and track progress
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* <button onClick={handleExport} className="group inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2 text-xs font-semibold text-brand-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-magenta/40 hover:shadow-md">
              <Download size={14} className="transition-transform group-hover:translate-y-0.5" /> Export
            </button> */}
            <button onClick={openCreate} className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_-6px_rgba(227,28,121,0.6)] transition-all hover:-translate-y-0.5 hover:brightness-110">
              <Plus size={14} className="transition-transform group-hover:rotate-90" /> New Task
            </button>
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-brand-magenta to-brand-purple" />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">Task Overview</p>
              <h2 className="font-display text-sm font-semibold text-brand-ink">Live Snapshot</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <KpiCard icon={CheckSquare} label="Total" value={summary.total} sub="All marketing tasks" color="purple" delay={0} />
            <KpiCard icon={Clock} label="Pending" value={summary.pending} sub="Awaiting action" color="blue" delay={40} />
            <KpiCard icon={PlayCircle} label="In Progress" value={summary.inProgress} sub="Being worked on" color="violet" delay={80} />
            <KpiCard icon={CheckCircle2} label="Completed" value={summary.completed} sub="Done & closed" color="emerald" delay={120} />
            <KpiCard icon={AlertCircle} label="Overdue" value={summary.overdue} sub="Needs attention" color="rose" delay={160} />
          </div>
        </div>

        {/* TABS */}
        <div className="card !p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {TASK_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              const count = tabCounts[t.key] ?? 0;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${active ? 'bg-gradient-to-r from-brand-magenta to-brand-purple text-white shadow-[0_4px_14px_-4px_rgba(227,28,121,0.5)] scale-[1.02]' : 'text-brand-ink/60 hover:bg-brand-lilac/50 hover:text-brand-magenta'}`}>
                  <Icon size={13} />
                  {t.label}
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-brand-lilac/70 text-brand-purple'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/40" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by title, category, project…" className="w-full rounded-full border border-brand-lilac bg-white py-2.5 pl-11 pr-10 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-brand-lilac">
                <X size={14} className="text-brand-ink/50" />
              </button>
            )}
          </div>

          <DropdownFilter label="Status" icon={Filter} value={statusFilter} options={['All', ...TASK_STATUSES]} open={statusOpen} onToggle={() => { setStatusOpen((s) => !s); setPriorityOpen(false); setCategoryOpen(false); }} onChange={(v) => { setStatusFilter(v); setStatusOpen(false); }} />
          <DropdownFilter label="Priority" icon={Flame} value={priorityFilter} options={['All', 'High', 'Medium', 'Low']} open={priorityOpen} onToggle={() => { setPriorityOpen((s) => !s); setStatusOpen(false); setCategoryOpen(false); }} onChange={(v) => { setPriorityFilter(v); setPriorityOpen(false); }} />
          <DropdownFilter label="Category" icon={Briefcase} value={categoryFilter} options={['All', ...TASK_CATEGORIES]} open={categoryOpen} onToggle={() => { setCategoryOpen((s) => !s); setStatusOpen(false); setPriorityOpen(false); }} onChange={(v) => { setCategoryFilter(v); setCategoryOpen(false); }} />

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-100">
              <X size={12} /> Clear
            </button>
          )}

          <span className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink">
            <Filter size={14} className="text-brand-magenta" />
            Showing: <span className="text-brand-magenta">{tabFiltered.length}</span>
          </span>

          <div className="flex items-center gap-1 rounded-full border border-brand-lilac bg-white p-1">
            <button onClick={() => setViewMode('grid')} className={`rounded-full p-1.5 transition-all ${viewMode === 'grid' ? 'border border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'text-brand-ink/50 hover:bg-brand-lilac/30'}`} title="Grid view" aria-label="Grid view">
              <Grid3x3 size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={`rounded-full p-1.5 transition-all ${viewMode === 'list' ? 'border border-brand-magenta bg-brand-magenta/10 text-brand-magenta' : 'text-brand-ink/50 hover:bg-brand-lilac/30'}`} title="List view" aria-label="List view">
              <List size={14} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {tabFiltered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} onCreate={openCreate} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 pb-40 md:grid-cols-2 xl:grid-cols-3">
            {tabFiltered.map((t) => (
              <TaskCard key={t.id} task={{ ...t, status: getEffectiveStatus(t) }} onView={() => openView(t)} onEdit={() => openEdit(t)} onComplete={() => handleComplete(t.id)} onStart={() => handleStart(t.id)} onReopen={() => handleReopen(t.id)} />
            ))}
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-brand-lilac/60 bg-brand-mist/40 text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">
                  <tr>
                    <th className="w-[24%] px-3 py-3">Task</th>
                    <th className="w-[14%] px-3 py-3">Category</th>
                    <th className="w-[12%] px-3 py-3">Due</th>
                    <th className="w-[12%] px-3 py-3">Priority</th>
                    <th className="w-[13%] px-3 py-3">Status</th>
                    <th className="w-[11%] px-3 py-3">Assignee</th>
                    <th className="w-[14%] px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-lilac/40">
                  {tabFiltered.map((t) => {
                    const status = getEffectiveStatus(t);
                    const st = STATUS_STYLES[status] || STATUS_STYLES.Pending;
                    const StatusIcon = st.icon;
                    const pr = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium;
                    const PriorityIcon = pr.icon;
                    const CatIcon = CATEGORY_ICONS[t.category] || Briefcase;
                    return (
                      <tr key={t.id} className="transition-colors hover:bg-brand-mist/30">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-sm">
                              <CatIcon size={12} />
                            </span>
                            <div className="min-w-0">
                              <button onClick={() => openView(t)} className="block truncate text-left text-xs font-semibold text-brand-ink hover:text-brand-magenta" title={t.title}>{t.title}</button>
                              <p className="truncate font-mono text-[9px] text-brand-ink/50" title={`${t.id} · ${t.project}`}>{t.id} · {t.project}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3"><p className="truncate text-xs text-brand-ink/70" title={t.category}>{t.category}</p></td>
                        <td className="px-3 py-3"><p className="font-mono text-[11px] text-brand-ink/70">{formatShortDate(t.due)}</p><p className="text-[9px] text-brand-ink/40">{relativeDue(t.due)}</p></td>
                        <td className="px-3 py-3"><div className="flex"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${pr.chip}`}><PriorityIcon size={9} />{t.priority}</span></div></td>
                        <td className="px-3 py-3"><div className="flex"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${st.chip}`}><StatusIcon size={9} />{status}</span></div></td>
                        <td className="px-3 py-3"><p className="truncate text-xs text-brand-ink/70" title={t.assignee}>{t.assignee || '—'}</p></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openView(t)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-lilac bg-white text-brand-ink/60 transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta" title="View details" aria-label="View task details"><Eye size={13} /></button>
                            <button onClick={() => openEdit(t)} className="flex h-7 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-brand-magenta to-brand-purple px-2.5 text-[10px] font-semibold text-white shadow-card transition-all hover:brightness-110" title="Edit task"><Pencil size={10} /> Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showModal && (
          <TaskModal key={editing?.id || 'new-task'} mode={editing ? 'edit' : 'create'} initial={editing} assignees={ASSIGNEES} onClose={closeModal} onSubmit={(data) => (editing ? handleEdit(editing.id, data) : handleCreate(data))} onDelete={editing ? () => { setShowModal(false); setConfirmDelete(editing); } : null} onComplete={editing ? () => { handleComplete(editing.id); closeModal(); } : null} onStart={editing ? () => { handleStart(editing.id); closeModal(); } : null} onReopen={editing ? () => { handleReopen(editing.id); closeModal(); } : null} />
        )}

        {viewing && (
          <TaskDetailDrawer task={{ ...viewing, status: getEffectiveStatus(viewing) }} onClose={closeView} onEdit={() => { const task = viewing; closeView(); openEdit(task); }} onComplete={() => handleComplete(viewing.id)} onStart={() => handleStart(viewing.id)} onReopen={() => handleReopen(viewing.id)} onStatusChange={(s) => handleStatusChange(viewing.id, s)} onDelete={() => { const task = viewing; closeView(); setConfirmDelete(task); }} />
        )}

        {confirmDelete && (
          <ConfirmDialog title={`Delete "${confirmDelete.title}"?`} message="This will permanently delete this task. This action cannot be undone." confirmLabel="Delete Task" onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete.id)} />
        )}

        {toast && <Toast message={toast.msg} type={toast.type} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, sub, color = 'purple', delay = 0 }) {
  const displayValue = useAnimatedCount(value);
  const themes = {
    purple: { border: 'border-violet-200 hover:border-violet-400', bg: 'from-violet-50 via-violet-50/30 to-white', iconBg: 'bg-violet-100 text-brand-purple border-violet-200', bar: 'from-brand-purple to-brand-magenta', glow: 'bg-brand-purple/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(139,47,214,0.45)]', valueColor: 'text-brand-purple' },
    blue: { border: 'border-blue-200 hover:border-blue-400', bg: 'from-blue-50 via-blue-50/30 to-white', iconBg: 'bg-blue-100 text-blue-600 border-blue-200', bar: 'from-blue-500 to-blue-400', glow: 'bg-blue-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(59,130,246,0.4)]', valueColor: 'text-blue-600' },
    violet: { border: 'border-violet-200 hover:border-violet-400', bg: 'from-violet-50 via-violet-50/30 to-white', iconBg: 'bg-violet-100 text-brand-purple border-violet-200', bar: 'from-violet-500 to-violet-400', glow: 'bg-violet-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(139,47,214,0.4)]', valueColor: 'text-brand-purple' },
    emerald: { border: 'border-emerald-200 hover:border-emerald-400', bg: 'from-emerald-50 via-emerald-50/30 to-white', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200', bar: 'from-emerald-500 to-emerald-400', glow: 'bg-emerald-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(16,185,129,0.4)]', valueColor: 'text-emerald-600' },
    amber: { border: 'border-amber-200 hover:border-amber-400', bg: 'from-amber-50 via-amber-50/30 to-white', iconBg: 'bg-amber-100 text-amber-600 border-amber-200', bar: 'from-amber-500 to-orange-400', glow: 'bg-amber-500/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(245,158,11,0.4)]', valueColor: 'text-amber-600' },
    rose: { border: 'border-rose-200 hover:border-rose-400', bg: 'from-rose-50 via-rose-50/30 to-white', iconBg: 'bg-rose-100 text-brand-magenta border-rose-200', bar: 'from-brand-magenta to-brand-purple', glow: 'bg-brand-magenta/25', shadow: 'hover:shadow-[0_15px_40px_-15px_rgba(227,28,121,0.45)]', valueColor: 'text-brand-magenta' },
  };
  const t = themes[color] || themes.purple;

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white via-white to-brand-mist/30 p-4 text-left shadow-[0_4px_16px_-8px_rgba(139,47,214,0.12)] transition-all duration-300 hover:-translate-y-1.5 animate-fade-slide-in ${t.border} ${t.shadow}`}>
      <span className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${t.bar} transition-transform duration-500 group-hover:scale-x-100`} />
      <span className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
      <span className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${t.glow} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`} />
      <div className="relative z-10 flex w-full items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${t.iconBg} shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}><Icon size={18} /></span>
      </div>
      <div className="relative z-10 w-full">
        <p className={`truncate font-display text-2xl font-bold leading-tight tabular-nums ${t.valueColor}`}>{displayValue}</p>
        <p className="mt-0.5 text-xs font-semibold text-brand-ink/75">{label}</p>
        {sub && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-brand-ink/50">{sub}</p>}
      </div>
    </div>
  );
}

function useAnimatedCount(target, duration = 600) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const to = Number(target) || 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (to <= 0) {
      setDisplay(0);
      return undefined;
    }
    startRef.current = null;
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const progress = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(to * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, duration]);

  return display.toLocaleString('en-IN');
}

/* ═══════════════════════════════════════════════════════════════
   DROPDOWN FILTER
   ═══════════════════════════════════════════════════════════════ */
function DropdownFilter({ label, icon: Icon, value, options, open, onToggle, onChange }) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} aria-expanded={open} className="inline-flex items-center gap-2 rounded-full border border-brand-lilac bg-white px-4 py-2.5 text-sm font-medium text-brand-ink hover:bg-brand-lilac/40">
        {Icon && <Icon size={14} className="text-brand-magenta" />}
        {label}: <span className="max-w-[140px] truncate font-semibold text-brand-magenta">{value}</span>
        <ChevronDown size={14} className={`text-brand-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full z-30 mt-2 max-h-72 w-56 overflow-y-auto no-scrollbar rounded-xl border border-brand-lilac bg-white p-1 shadow-panel">
            {options.map((o) => (
              <button type="button" key={o} onClick={() => onChange(o)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${value === o ? 'bg-brand-magenta/10 font-semibold text-brand-magenta' : 'text-brand-ink/70 hover:bg-brand-lilac/40'}`}>{o}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK CARD (GRID)
   ═══════════════════════════════════════════════════════════════ */
function TaskCard({ task: t, onView, onEdit, onComplete, onStart, onReopen }) {
  const st = STATUS_STYLES[t.status] || STATUS_STYLES.Pending;
  const StatusIcon = st.icon;
  const pr = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium;
  const PriorityIcon = pr.icon;
  const CatIcon = CATEGORY_ICONS[t.category] || Briefcase;

  return (
    <div className="group relative flex flex-col rounded-2xl border-2 border-brand-lilac/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-magenta/50 hover:shadow-[0_20px_45px_-15px_rgba(227,28,121,0.25)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-2xl bg-gradient-to-r from-brand-magenta to-brand-purple transition-transform duration-500 group-hover:scale-x-100" />
      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-md"><CatIcon size={18} /></span>
          <div className="min-w-0 flex-1 pr-1">
            <button onClick={onView} className="block w-full text-left font-display text-base font-semibold leading-tight text-brand-ink hover:text-brand-magenta whitespace-normal break-words" title={t.title}>{t.title}</button>
            <p className="mt-0.5 truncate text-[11px] font-mono text-brand-ink/50">{t.id}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${st.chip}`} title={t.status}><StatusIcon size={9} className="mr-1 inline" />{t.status}</span>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-brand-lilac/60 bg-gradient-to-br from-brand-mist/80 to-brand-mist/40 p-3 text-xs">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><Briefcase size={11} className="shrink-0 text-brand-ink/50" /><span className="truncate text-brand-ink/50">Category</span><span className="truncate text-right font-semibold text-brand-ink">{t.category}</span></div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><Calendar size={11} className="shrink-0 text-brand-ink/50" /><span className="truncate text-brand-ink/50">Due</span><span className="truncate text-right font-semibold text-brand-ink">{relativeDue(t.due)}</span></div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><Users size={11} className="shrink-0 text-brand-ink/50" /><span className="truncate text-brand-ink/50">Assignee</span><span className="truncate text-right font-semibold text-brand-ink">{t.assignee || '—'}</span></div>
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><Target size={11} className="shrink-0 text-brand-ink/50" /><span className="truncate text-brand-ink/50">Project</span><span className="truncate text-right font-semibold text-brand-ink">{t.project || '—'}</span></div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-lilac/60 bg-brand-mist/40 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-wider text-brand-ink/50">Priority</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${pr.chip}`}><PriorityIcon size={10} />{t.priority}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {t.status !== 'Completed' && t.status !== 'Cancelled' && (
            <button onClick={onComplete} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-100"><CheckCircle2 size={12} className="shrink-0" /><span className="truncate">Complete</span></button>
          )}
          {t.status === 'Pending' && (
            <button onClick={onStart} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2 py-2 text-xs font-semibold text-brand-purple transition-all hover:bg-violet-100"><PlayCircle size={12} className="shrink-0" /><span className="truncate">Start</span></button>
          )}
          {(t.status === 'Completed' || t.status === 'Cancelled' || t.status === 'Overdue') && (
            <button onClick={onReopen} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-100"><RotateCcw size={12} className="shrink-0" /><span className="truncate">Reopen</span></button>
          )}
          <button onClick={onView} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-brand-lilac bg-white px-2 py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-magenta/40 hover:bg-brand-magenta/5 hover:text-brand-magenta"><Eye size={12} className="shrink-0" /><span className="truncate">View</span></button>
          <button onClick={onEdit} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-2 py-2 text-xs font-semibold text-white shadow-card transition-all hover:brightness-110"><Pencil size={12} className="shrink-0" /><span className="truncate">Edit</span></button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK MODAL
   ═══════════════════════════════════════════════════════════════ */
function TaskModal({ mode = 'create', initial = null, assignees, onClose, onSubmit, onDelete, onComplete, onStart, onReopen }) {
  const seed = initial || {};
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    title: seed.title || '',
    category: seed.category || 'Campaign Setup',
    due: seed.due || todayISO(),
    priority: seed.priority || 'Medium',
    status: seed.status || 'Pending',
    assignee: seed.assignee || 'Self',
    project: seed.project || '',
    notes: seed.notes || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    if (!form.due) { setError('Due date is required.'); return; }
    if (form.due < '1900-01-01') { setError('Please enter a valid due date.'); return; }
    setError('');
    setSubmitting(true);
    onSubmit({ ...form, title: form.title.trim(), project: form.project.trim(), notes: form.notes.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-panel">
        <div className="flex items-center justify-between gap-3 border-b border-brand-lilac/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white"><CheckSquare size={18} /></span>
            <div>
              <h3 className="font-display text-base font-bold text-brand-ink">{isEdit ? 'Edit Marketing Task' : 'Add New Marketing Task'}</h3>
              <p className="text-[11px] text-brand-ink/50">{isEdit ? 'Update task details or perform an action' : 'Create a task for your daily marketing activity'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac" aria-label="Close modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          <SectionTitle icon={CheckSquare} label="Task Details" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ModalInput inputRef={titleRef} label="Task Title *" value={form.title} onChange={(v) => updateForm('title', v)} placeholder="e.g. Review Google Ads Leads" icon={CheckSquare} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Category *</label>
              <select value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15">
                {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <ModalInput label="Due Date *" type="date" value={form.due} onChange={(v) => updateForm('due', v)} icon={Calendar} required />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Assignee</label>
              <select value={form.assignee} onChange={(e) => updateForm('assignee', e.target.value)} className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15">
                {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <ModalInput label="Project" value={form.project} onChange={(v) => updateForm('project', v)} placeholder="e.g. Eliteinova Matrimony" icon={Target} />
          </div>

          <SectionTitle icon={Sparkles} label="Status & Priority" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Status</label>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((s) => {
                  const st = STATUS_STYLES[s];
                  const StatusIcon = st.icon;
                  const active = form.status === s;
                  return <button type="button" key={s} onClick={() => updateForm('status', s)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${active ? `${st.chip} ring-2 ring-brand-magenta/20` : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'}`}><StatusIcon size={12} />{s}</button>;
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['High', 'Medium', 'Low'].map((p) => {
                  const pr = PRIORITY_STYLES[p];
                  const PriorityIcon = pr.icon;
                  const active = form.priority === p;
                  return <button type="button" key={p} onClick={() => updateForm('priority', p)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${active ? `${pr.chip} ring-2 ring-brand-magenta/20` : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'}`}><PriorityIcon size={12} />{p}</button>;
                })}
              </div>
            </div>
          </div>

          <SectionTitle icon={Activity} label="Notes" />
          <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Add any context or details about this task..." rows={3} className="w-full rounded-xl border border-brand-lilac bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15" />

          {error && <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"><AlertCircle size={14} className="mt-0.5 shrink-0" />{error}</div>}

          {isEdit && (
            <div className="space-y-2 rounded-xl border border-brand-lilac/60 bg-brand-mist/40 p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {form.status === 'Pending' && <button type="button" onClick={onStart} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-brand-purple hover:bg-violet-100"><PlayCircle size={12} /> Start Task</button>}
                {form.status !== 'Completed' && form.status !== 'Cancelled' && <button type="button" onClick={onComplete} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"><CheckCircle2 size={12} /> Mark Complete</button>}
                {(form.status === 'Completed' || form.status === 'Cancelled' || form.status === 'Overdue') && <button type="button" onClick={onReopen} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-100"><RotateCcw size={12} /> Reopen Task</button>}
                <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-100"><Trash2 size={12} /> Delete Task</button>
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t border-brand-lilac/60 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110 disabled:opacity-60">{submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 border-b border-brand-lilac/60 pb-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-magenta/10 to-brand-purple/10 text-brand-magenta">{Icon ? <Icon size={12} /> : null}</span>
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink/60">{label}</h4>
    </div>
  );
}

function ModalInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, required, inputRef }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-brand-ink/70">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-magenta/60" />}
        <input ref={inputRef} type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl border border-brand-lilac bg-white py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 text-sm outline-none focus:border-brand-magenta focus:ring-2 focus:ring-brand-magenta/15`} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK DETAIL DRAWER
   ═══════════════════════════════════════════════════════════════ */
function TaskDetailDrawer({ task: t, onClose, onEdit, onComplete, onStart, onReopen, onStatusChange, onDelete }) {
  const st = STATUS_STYLES[t.status] || STATUS_STYLES.Pending;
  const StatusIcon = st.icon;
  const pr = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium;
  const PriorityIcon = pr.icon;
  const CatIcon = CATEGORY_ICONS[t.category] || Briefcase;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-panel animate-slide-in-right">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-brand-lilac bg-gradient-to-r from-brand-mist/60 to-white px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-sm"><CatIcon size={18} /></span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-magenta">{t.id}</p>
              <h3 className="font-display text-base font-bold text-brand-ink">{t.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-brand-ink/50 hover:bg-brand-lilac" aria-label="Close details"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${st.chip}`}><StatusIcon size={12} />{t.status}</span>
            {t.assignee && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-lilac/60 px-3 py-1.5 text-xs font-bold text-brand-purple"><Users size={12} />{t.assignee}</span>}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${pr.chip}`}><PriorityIcon size={12} />{t.priority} Priority</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-brand-lilac bg-gradient-to-br from-brand-mist/60 to-white p-5">
            <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-magenta/10 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-magenta to-brand-purple text-white shadow-md"><CatIcon size={24} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-brand-ink">{t.title}</p>
                <p className="font-mono text-[11px] text-brand-ink/50">{t.id} · {t.category}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-ink/70">
                  <span className="inline-flex items-center gap-1.5"><Calendar size={11} className="text-brand-magenta" /> Due {formatShortDate(t.due)} ({relativeDue(t.due)})</span>
                  {t.project && <span className="inline-flex items-center gap-1.5"><Target size={11} className="text-brand-magenta" />{t.project}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="card !p-5 space-y-3">
            <SectionTitle icon={CheckSquare} label="Task Details" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoRow icon={Briefcase} label="Category" value={t.category} />
              <InfoRow icon={Calendar} label="Due Date" value={`${formatDate(t.due)} (${relativeDue(t.due)})`} />
              <InfoRow icon={Users} label="Assignee" value={t.assignee || '—'} />
              <InfoRow icon={Target} label="Project" value={t.project || '—'} />
              <InfoRow icon={Flag} label="Priority" value={t.priority} />
              <InfoRow icon={Clock} label="Created" value={formatDate(t.createdAt)} />
            </div>
          </div>

          {t.notes && (
            <div className="card !p-5">
              <SectionTitle icon={Activity} label="Notes" />
              <p className="mt-3 whitespace-pre-line rounded-xl border border-brand-lilac/60 bg-brand-mist/40 p-3 text-sm text-brand-ink/80">{t.notes}</p>
            </div>
          )}

          {t.history && t.history.length > 0 && (
            <div className="card !p-5">
              <SectionTitle icon={Activity} label="Task History" />
              <div className="relative mt-3 space-y-3">
                <span className="pointer-events-none absolute bottom-3 left-[7px] top-3 w-px bg-brand-lilac" />
                {t.history.map((h, i) => (
                  <div key={`${h.at}-${h.action}-${i}`} className="relative flex items-start gap-3">
                    <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br from-brand-magenta to-brand-purple ring-4 ring-white" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-ink">{h.action}</p>
                      <p className="text-[10px] text-brand-ink/40">{formatDate(h.at)} · {h.by || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card !p-5">
            <SectionTitle icon={Sparkles} label="Change Status" />
            <div className="mt-3 flex flex-wrap gap-2">
              {TASK_STATUSES.map((stt) => {
                const cs = STATUS_STYLES[stt];
                const SIcon = cs.icon;
                const active = t.status === stt;
                return <button type="button" key={stt} onClick={() => onStatusChange(stt)} disabled={active} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-default ${active ? `${cs.chip} ring-2 ring-brand-magenta/20` : 'border-brand-lilac bg-white text-brand-ink/60 hover:bg-brand-lilac/30'}`}><SIcon size={12} />{stt}</button>;
              })}
            </div>
          </div>

          <div className="card !p-5">
            <SectionTitle icon={Target} label="Actions" />
            <div className="mt-3 flex flex-wrap gap-2">
              {t.status === 'Pending' && <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-brand-purple hover:bg-violet-100"><PlayCircle size={12} /> Start Task</button>}
              {t.status !== 'Completed' && t.status !== 'Cancelled' && <button onClick={onComplete} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"><CheckCircle2 size={12} /> Mark Complete</button>}
              {(t.status === 'Completed' || t.status === 'Cancelled' || t.status === 'Overdue') && <button onClick={onReopen} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-100"><RotateCcw size={12} /> Reopen Task</button>}
              <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-3 py-2 text-xs font-semibold text-white shadow-card hover:brightness-110"><Pencil size={12} /> Edit Task</button>
              <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-100"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-lilac/50 text-brand-magenta"><Icon size={14} /></span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="shrink-0 text-brand-ink/50">{label}</span>
        <span className="truncate font-semibold text-brand-ink">{value}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY / CONFIRM / TOAST
   ═══════════════════════════════════════════════════════════════ */
function EmptyState({ hasFilters, onClear, onCreate }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-lilac text-brand-magenta"><Inbox size={22} /></span>
      <p className="font-display text-base font-semibold text-brand-ink">{hasFilters ? 'No tasks match your filters' : 'No tasks in this tab yet'}</p>
      <p className="max-w-sm text-sm text-brand-ink/50">
        {hasFilters ? <button onClick={onClear} className="font-semibold text-brand-magenta hover:underline">Clear all filters</button> : 'Create a task to start organizing your daily marketing activities.'}
      </p>
      {!hasFilters && <button onClick={onCreate} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-magenta to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:brightness-110"><Plus size={16} /> Create First Task</button>}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500"><AlertCircle size={18} /></div>
          <h3 className="font-display text-base font-semibold text-brand-ink">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-brand-ink/60">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-brand-lilac py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-lilac/40">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2">
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-panel ${type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
        {type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        {message}
      </div>
    </div>
  );
}